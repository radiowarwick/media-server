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
 * Ensure that the music media directory exists locally on the server.
 */
fs.ensureDir("./media/music");

/**
 * Ensure that the directories for artist and track images exists locally on the server.
 */
fs.ensureDir("./media/music/artist");
fs.ensureDir("./media/music/track");

/**
 * Get an artist's image. This is usually a candid shot of the artist in-front of a tree.
 */
router.get("/artist/:artist." + config.MUSIC.FILE_EXTENSION, async ctx => {
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
   * Define the path of the locally stored image.
   * If no filename could be resolved, set the path to that of the the default resource.
   */
  const path = filename
    ? "./media/music/artist/" + filename
    : "./media/defaults/" +
      config.MUSIC.DEFAULT_RESOURCE +
      "." +
      config.MUSIC.FILE_EXTENSION;

  /**
   * Serve the artist image.
   */
  ctx.set("Content-Type", config.MUSIC.MIME_TYPE);
  ctx.body = await fs.readFile(path);
});

/**
 * Get a track's image. This is usually the album art.
 *
 * Will return the album art, or else the artist image, or else a default image.
 */
router.get(
  "/track/:artist/:title." + config.MUSIC.FILE_EXTENSION,
  async ctx => {
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
     * Define the path of the locally stored image.
     * If no filename could be resolved, set the path to that of the the default resource.
     */
    const path = filename
      ? "./media/music/track/" + filename
      : "./media/defaults/" +
        config.MUSIC.DEFAULT_RESOURCE +
        "." +
        config.MUSIC.FILE_EXTENSION;

    /**
     * Serve the track image.
     */
    ctx.set("Content-Type", config.MUSIC.MIME_TYPE);
    ctx.body = await fs.readFile(path);
  }
);

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
 * Gets the file type from a given path or url as a string.
 *
 * @param {string} str - The string from which the type should be extracted.
 */
const getFileType = str => {
  const parts = str.split(".");
  return parts[parts.length - 1];
};

/**
 * Saves an image from a remote location to local disk of a given path.
 *
 * @param {string} imgURL - The remote URL to fetch.
 * @param {string} dir - The dir to save the remote URL.
 * @param {string} hash - The hashed string, which will be used as the file name.
 */
const saveImage = async (imgURL, dir, hash) => {
  /**
   * Get the file type of the remote image URL.
   */
  const type = getFileType(imgURL);

  /**
   * Build the path string.
   */
  const path = dir + "/" + hash + "." + type;

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
       * Executing methods on the returned jimp object carries out image manipulation.
       * Here we:
       * - Resize the image to the dimensions defined by the configuration.
       * - Compress slightly (lossy but almost unnoticeable).
       * - Re-write the file, converting to the configuration file's defined file type if required.
       */
      image
        .cover(
          config.MUSIC.PIXEL_DIMENSIONS.WIDTH,
          config.MUSIC.PIXEL_DIMENSIONS.HEIGHT
        )
        .quality(75)
        .write(path.replace("." + type, "." + config.MUSIC.FILE_EXTENSION));

      /**
       * If the original downloaded file is of a different file extension to the newly converted file,
       * then delete the originally downloaded file.
       *
       * If the original file was already of the same file type of the newly converted file,
       * then we overwrote the original so no need to delete anything.
       */
      if (type !== config.MUSIC.FILE_EXTENSION) await fs.unlink(path);

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
 * First, we will check if the file if available on local disk.
 * If not, we will fetch and save a remote image to local disk.
 * If no image is available, return null.
 *
 * @param {string} string - The string representation of the filename. This is a normal, escaped string.
 * @param {string} path - The path under which the file should be located. Also the save path in the event of a remote download.
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
  const exists = await fs.pathExists(
    path + hash + "." + config.MUSIC.FILE_EXTENSION
  );

  if (!exists) {
    /**
     * Fetch the URL of the remote image to download.
     */
    const imgURL = await fetchRemoteImageURL(searchParams);

    /**
     * If an image is available to download, save it to local disk and return the matching filename
     * (which is the hashed string) of the now saved image.
     */
    if (imgURL) {
      await saveImage(imgURL, path, hash);
      return hash + "." + config.MUSIC.FILE_EXTENSION;
    }
  } else {
    /**
     * Image is on local disk, so return the matching filename.
     */
    return hash + "." + config.MUSIC.FILE_EXTENSION;
  }

  /**
   * Unable to fetch any image, so return null.
   */
  return null;
};

/**
 * Returns the URL of an image from a remote API based on search parameters.
 *
 * This function is specific to the Discogs API, and is technically the only function which
 * needs to be changed if Discogs is depreciated.
 *
 * This function returns a valid URL as a string or null. If you are re-implementing with a different API,
 * please follow this return style strictly.
 *
 * @param {object} params - The GET parameters for the remote request.
 */
const fetchRemoteImageURL = async params => {
  /**
   * If we are not rate-limited by the Discogs API (429), then proceed with the request.
   */
  if (!limited) {
    /**
     * Fetch the response from the Discogs "Database Search" endpoint.
     * Limit the response to the most relevant response by returning only the top result (per_page = 1).
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
     * In an async environment like this, a reasonable buffer of 5 requests is allocated, as the requests
     * already underway will continue to reduce the remaining number of calls left.
     *
     * This is not a failsafe block, and it is possible that very heavy loads (more than 5 async calls)
     * will cause Koa to pass through a 429 error directly to the client.
     */
    if (response.headers["x-discogs-ratelimit-remaining"] <= 5) {
      limited = true;
      setTimeout(() => (limited = false), 10000);
    }

    if (response.data.results[0] && response.data.results[0].cover_image) {
      /**
       * Only return a valid URL if it is a JPG, because for some reason,
       * DISCOGS serves a broken GIF image as a "spacer", but all JPGs are just dandy.
       */
      if (getFileType(response.data.results[0].cover_image) === "jpg")
        return response.data.results[0].cover_image;
    }
  }

  /**
   * If no valid image can be found, return null.
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
     */
    images.forEach(async image => {
      fs.stat(dir + image, async (err, stats) => {
        if (!err) {
          if (stats.birthtimeMs + 1209600000 < Date.now()) {
            await fs.unlink(dir + image);
          }
        }
      });
    });
  });
});

//

/**
 * Export the routes and pruner.
 */
module.exports = { router: router, pruner: pruner };
