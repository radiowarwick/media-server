const koaRouter = require("koa-router");
const fs = require("fs-extra");

const router = new koaRouter();

/**
 * Returns exec images (if found) or default.
 * Enforces JPEG filetype.
 */
router.get("/exec/:username", async ctx => {
  ctx.set("Content-Type", "image/jpeg");
  ctx.body = await resolve("./media/static/exec", ctx.params.username, "jpg");
});

/**
 * Returns show images (if found) or default.
 * Enforces jpg filetype.
 */
router.get("/shows/:showid", async ctx => {
  ctx.set("Content-Type", "image/jpeg");
  ctx.body = await resolve("./media/static/shows", ctx.params.showid, "jpg");
});

/**
 * Returns video files (if found) or default.
 * Enforces MP4 filetype.
 */
router.get("/video/:filename", async ctx => {
  ctx.set("Content-Type", "video/mp4");
  ctx.body = await resolve("./media/static/video", ctx.params.filename, "mp4");
});

/**
 * Returns marketing images (if found) or default.
 * Enforces jpg filetype.
 */
router.get("/marketing/:filename", async ctx => {
  ctx.set("Content-Type", "image/jpeg");
  ctx.body = await resolve(
    "./media/static/marketing",
    ctx.params.filename,
    "jpg"
  );
});

/**
 * Resolves a file from a given path, returning default if not found.
 */
async function resolve(dir, filename, type) {
  /**
   * Normalise the filename.
   */
  filename = filename.toLowerCase();

  /**
   * Construct the path at which the file *should* be found.
   */
  const path = dir + "/" + filename + "." + type;

  /**
   * Boolean which defines if the file exists.
   */
  const exists = await fs.pathExists(path);

  /**
   * If exists, return the file.
   * Else, return default of a given file type.
   */
  if (exists) return await fs.readFile(path);
  else return await fs.readFile(dir + "/default." + type);
}

/**
 * Export the router.
 */
module.exports = {
  router: router
};
