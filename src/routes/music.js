const koaRouter = require("koa-router");
const CronJob = require("cron").CronJob;
const crypto = require("crypto");
const axios = require("axios");
const jimp = require("jimp");
const fs = require("fs-extra");

const config = require("../config");

const router = new koaRouter();

let limited = false;

/**
 * Get an artist's image. This is usually a candid shot of the artist infront of a tree.
 */
router.get("/artist/:artist", async ctx => {
  /**
   * Extract and escape the request parameters.
   */
  const artist = escapeString(ctx.params.artist);

  /**
   * Attempt to resolve an image based on artist name.
   * The search params are configured to search for an artist "profile" image.
   */
  let filename = await resolveFilename(artist, "./media/music/artist/", {
    q: artist,
    type: "artist"
  });

  /**
   * Finally, if no filename could be resolved, set it to equal the default image.
   */
  if (!filename) filename = "default.jpg";

  /**
   * Serve the artist image.
   */
  ctx.set("Content-Type", "image/jpeg");
  ctx.body = await fs.readFile("./media/music/artist/" + filename);
});

/**
 * Get a track's image. This is usually the album art.
 *
 * Will return the album art, or else the artist image, or else a default image.
 */
router.get("/track/:artist/:title", async ctx => {
  /**
   * Extract and escape the request parameters
   */
  const artist = escapeString(ctx.params.artist);
  const title = escapeString(ctx.params.title);

  /**
   * Attempt to resolve a filename for the artist and title combo.
   * The search params are configured to search for album art.
   */
  let filename = await resolveFilename(
    artist + ":" + title,
    "./media/music/track/",
    {
      q: title,
      artist: artist,
      type: "release"
    }
  );

  /**
   * If the filename was not resolved by the previous attempt, instead try to resolve
   * based on artist only.
   * The search params are configured to search for an artist "profile" image.
   */
  if (!filename) {
    filename = await resolveFilename(
      artist + ":" + title,
      "./media/music/track/",
      {
        q: artist,
        type: "artist"
      }
    );
  }

  /**
   * Finally, if no filename could be resolved, set it to equal the default image.
   */
  if (!filename) filename = "default.jpg";

  /**
   * Serve the track image.
   */
  ctx.set("Content-Type", "image/jpeg");
  ctx.body = await fs.readFile("./media/music/track/" + filename);
});

/**
 * Returns an escaped string.
 * - Removes leading and trailing whitespace.
 * - All chars to lower case.
 * - Ensures single spaced words.
 */
const escapeString = str =>
  str
    .trim()
    .toLowerCase()
    .replace(/\s{2,}/g, " ");

/**
 * Generates a MD5 hash of a string. Hex encoded.
 *
 * @param {string} str - String to be hashed.
 */
const getHash = str =>
  crypto
    .createHash("md5")
    .update(str)
    .digest("hex");

/**
 * Saves an image from a remote location to local disk of a given path.
 *
 * Destroys existing file in path if marked as existing.
 *
 * @param {string} imgURL - The remote URL to fetch.
 * @param {string} dir - The dir to save the remote URL.
 * @param {string} filename - The filename of the file to save the remote URL.
 */
const saveImage = async (imgURL, dir, filename) => {
  /**
   * Build the path string.
   */
  const path = dir + "/" + filename;

  /**
   * Define a new file writer at the given path.
   */
  const writer = fs.createWriteStream(path);

  /**
   * Get the remote image, streaming the response to the writer.
   */
  const imgResponse = await axios({
    url: imgURL,
    method: "GET",
    responseType: "stream"
  });

  imgResponse.data.pipe(writer);

  /**
   * Returns a promise that resolves when writing, cropping and compression is complete.
   */
  return new Promise((resolve, reject) => {
    writer.on("finish", async () => {
      /**
       * Read the image into the jimp buffer.
       */
      const image = await jimp.read(path);

      /**
       * Executing methods on the returned jimp object carrys out image manupulation.
       * Here we:
       * - Change the image to a 512x512 square about the center of the image.
       * - Compress slightly (lossy but almost unnoticable).
       * - Re-write the file back to the same place.
       */
      image
        .cover(512, 512)
        .quality(75)
        .write(path);

      /**
       * Resolve the promise.
       */
      resolve();
    });
    writer.on("error", reject);
  });
};

/**
 * Resolves a filename for given parameters. Will return null if no filename can be found/created.
 * First, we will check if the file if avalable on local disk.
 * If not, we will fetch and save a remote image to local disk.
 * If no image is avaliable, return null.
 *
 * @param {string} string - The string representation of the filename. This is a normal, escaped string.
 * @param {string} path - The path under which the file should be located. Also thr save path in the event of a remote download.
 * @param {object} searchParams - If a remote search must be made, define the GET params of such a request here.
 */
const resolveFilename = async (string, path, searchParams) => {
  /**
   * Hash the string.
   */
  const hash = getHash(string);

  /**
   * Boolean to define if the file exists on local disk.
   */
  const exists = await fs.pathExists(path + hash + ".jpg");

  if (!exists) {
    /**
     * Fetch the URL of the remote image to download.
     */
    const imgURL = await fetchRemoteImageURL(searchParams);

    /**
     * If an image is avaliable to download, save it to local disk and return the matching filename of the now saved image.
     */
    if (imgURL) {
      await saveImage(imgURL, path, hash + ".jpg");
      return hash + ".jpg";
    }
  } else {
    /**
     * Image is on local disk, so return the matching filename.
     */
    return hash + ".jpg";
  }

  /**
   * Unable to fetch any image, so return null.
   */
  return null;
};

/**
 * Returns the URL of an image from a remote API based on search parameters.
 *
 * This function is specific to the Discogs API, and is technially the only function which
 * needs to be changed if Dicogs is depreciated.
 *
 * This function returns a valid URL as a string or null. If you are re-implementing with a different API,
 * please follow this return style strictly.
 *
 * @param {object} params - The GET parameters for the remote request.
 */
const fetchRemoteImageURL = async params => {
  /**
   * If we are not rate-limited by the Discogs API (429), then procceed with the request.
   */
  if (!limited) {
    /**
     * Fetch the response from the Discogs "Database Searcch" endpoint.
     * Limit the response to the most relevent response by returning only the top result (per_page = 1).
     * Finally, pass the Discogs API Key.
     */
    const response = await axios.get(
      "https://api.discogs.com/database/search",
      {
        params: { ...params, per_page: "1", token: config.DISCOGS_API_KEY }
      }
    );

    /**
     * If we have only 5 requests left to make, then halt/limit any requests for the next 10 seconds.
     *
     * In an async enviroment like this, a resonable buffer of 5 requests is allocated, as the requests
     * already underway will continue to reduce the remaining number of calls left.
     *
     * This is not a failsafe block, and it is possible that very heavy loads (more than 5 async calls)
     * will cause Koa to pass through a 429 error directly to the client.
     */
    if (response.headers["x-discogs-ratelimit-remaining"] <= 5) {
      limited = true;
      setTimeout(() => (limited = false), 10000);
    }

    if (response.data.results[0] && response.data.results[0].cover_image)
      return response.data.results[0].cover_image;
  }

  /**
   * If no image can be found, return null.
   */
  return null;
};

/**
 * Prunes the images at midnight every day, deleting images older than 14 days.
 */
const pruner = new CronJob("0 0 0 * * *", async () => {
  /**
   * Defines the directories to search in.
   */
  const dirs = ["./media/music/artist/", "./media/music/track/"];

  /**
   * For each directory, fetch the images within it.
   */
  await dirs.forEach(async dir => {
    const images = await fs.readdir(dir);

    /**
     * For each image in the directory, delete it if the image is older than 1209600000 milliseconds (14 days).
     *
     * Will not delete the default images.
     */
    images.forEach(async image => {
      if (image !== "default.jpg") {
        await fs.stat(dir + image, async (err, stats) => {
          if (!err) {
            if (stats.birthtimeMs + 1209600000 < Date.now()) {
              await fs.unlink(dir + image);
            }
          }
        });
      }
    });
  });
});

//

/**
 * Export the routes and pruner.
 */
module.exports = { router: router, pruner: pruner };
