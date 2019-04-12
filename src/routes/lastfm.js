const koaRouter = require("koa-router");
const CronJob = require("cron").CronJob;
const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs-extra");

const config = require("../config");
const utils = require("../utils");

const router = new koaRouter();

const endpoints = {
  artist: "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&format=json",
  track: "http://ws.audioscrobbler.com/2.0/?method=track.getInfo&format=json"
};

/**
 * Get an artist's image. This is usually a candid shot of the artist infront of a tree.
 */
router.get("/artist/:artist", async ctx => {
  /**
   * Gets the artist string and generates a hash based on it.
   */
  const artist = escapeString(ctx.params.artist);
  const hash = getHash(artist);

  /**
   * A boolean value which determines if the image for the artist exists in our local disk.
   */
  const exists = await fs.pathExists("./media/lastfm/artist/" + hash + ".png");

  /**
   * The base filename. Hopefully it will get overwritten. If not, a default image will be served.
   */
  let filename = "default.png";

  /**
   * If the image does not exist on local disk, the query the lastfm api to get the artist info.
   * Else, proceed.
   */
  if (!exists) {
    const response = await axios.get(endpoints.artist, {
      params: { artist: artist, api_key: config.LASTFM_API_KEY }
    });

    /**
     * If lastfm returns an error, then the artist does not exist on their systems.
     * Else, proceed.
     */
    if (!response.data.error && response.data.artist) {
      /**
       * Retrive the image URL from the response.
       */
      const imgURL = findImageURL(response.data.artist.image);

      /**
       * If the image is null, then lastfm has no image for this artist.
       * Else, proceed.
       */
      if (imgURL !== "") {
        /**
         * Set the filename to the new artist hash. All images are PNGs.
         */
        filename = hash + ".png";

        /**
         * Save the artist image to local disk.
         */
        await saveImage(imgURL, "./media/lastfm/artist/", filename, exists);
      }
    }
  } else {
    /**
     * If the artist image exists, set the filename to the hash value.
     */
    filename = hash + ".png";
  }

  /**
   * Serve the artist image.
   */
  ctx.set("Content-Type", "image/png");
  ctx.body = await fs.readFile("./media/lastfm/artist/" + filename);
});

/**
 * Get a track's image. This is usually the album art.
 */
router.get("/track/:artist/:track", async ctx => {
  /**
   * Get the artist and track from the request and hash them together.
   */
  const artist = escapeString(ctx.params.artist);
  const track = escapeString(ctx.params.track);
  const hash = getHash(artist + "/" + track);

  /**
   * A boolean value which determines if the image for the track exists in our local disk.
   */
  const exists = await fs.pathExists("./media/lastfm/track/" + hash + ".png");

  /**
   * The base filename. Hopefully it will get overwritten. If not, a default image will be served.
   */
  let filename = "default.png";

  /**
   * If the image does not exist on local disk, the query the lastfm api to get the track info.
   * Else, proceed.
   */
  if (!exists) {
    const response = await axios.get(endpoints.track, {
      params: { artist: artist, track: track, api_key: config.LASTFM_API_KEY }
    });

    /**
     * If lastfm returns an error or a null response, then the track and info does not exist on their systems.
     * Else, proceed.
     */
    if (!response.data.error && response.data.track.album) {
      /**
       * Retrive the image URL from the response.
       */
      const imgURL = findImageURL(response.data.track.album.image);

      /**
       * If the image is null, then lastfm has no image for this track.
       * Else, proceed.
       */
      if (imgURL !== "") {
        /**
         * Set the filename to the new track hash. All images are PNGs.
         */
        filename = hash + ".png";

        /**
         * Save the track image to local disk.
         */
        await saveImage(imgURL, "./media/lastfm/track/", filename, exists);
      }
    }
  } else {
    /**
     * If the track image exists, set the filename to the hash value.
     */
    filename = hash + ".png";
  }

  /**
   * Serve the track image.
   */
  ctx.set("Content-Type", "image/png");
  ctx.body = await fs.readFile("./media/lastfm/track/" + filename);
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
 * Finds and returns the correct sized image URL from an object.
 *
 * @param {*} obj - the object to be searched. Format defined by lastfm API.
 */
const findImageURL = obj => {
  const img = obj.find(image => image.size === "large");
  return img["#text"];
};

/**
 * Saves an image from a remote location to local disk of a given path.
 *
 * Destroys existing file in path if marked as existing.
 *
 * @param {string} imgURL - The remote URL to fetch.
 * @param {string} dir - The dir to save the remote URL.
 * @param {string} filename - The filename of the file to save the remote URL.
 * @param {bool} exists - Defines if there is a file already in the path.
 */
const saveImage = async (imgURL, dir, filename, exists) => {
  /**
   * Build the path string.
   */
  const path = dir + "/" + filename;

  /**
   * If the file exists, destroy it.
   *
   * Gives a new birthtime. Allows for pruning (see prune).
   */
  if (exists) await fs.unlink(path);

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
   * Returns a promise that resolves when writing and compression is complete.
   */
  return new Promise((resolve, reject) => {
    writer.on("finish", async () => {
      /**
       * Compresses the recieved png, roughly quartering the file size.
       */
      await utils.compressPNG(path, dir);
      resolve();
    });
    writer.on("error", reject);
  });
};

/**
 * Prunes the images at midnight every day, deleting images older than 14 days.
 */
const pruner = new CronJob("0 0 0 * * *", async () => {
  /**
   * Defines the directories to search in.
   */
  const dirs = ["./media/lastfm/artist/", "./media/lastfm/track/"];

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
      if (image !== "default.png") {
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
