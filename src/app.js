const Koa = require("koa");
const mount = require("koa-mount");
const compress = require("koa-compress");
const body = require("koa-body");

const app = new Koa();

/**
 * Import all the routes.
 */
const music = require("./routes/music");
const static = require("./routes/static");
const describe = require("./routes/describe");
const upload = require("./routes/upload");

/**
 * For each async piece of middleware, try it, and report on any errors.
 *
 * Koa middleware cascades, so putting this at the top of the file ensures all errors are captured.
 */
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { success: false, message: err.message };
    ctx.app.emit("error", err, ctx);
  }
});

/**
 * Compress all compressible responses over 2KB. This is includes JPEGs and MP4s
 */
app.use(
  compress({
    filter: type =>
      type === "image/jpeg" || "image/png" || "image/gif" || "video/mp4",
    threshold: 2048,
    flush: require("zlib").Z_SYNC_FLUSH
  })
);

/**
 * Allow KOA to parse the body of a request, including support for multipart forms.
 */
app.use(body({ multipart: true }));

/**
 * Define routes
 * - Music uses a cache-able router.
 * - Static is, well, static.
 * - Describe tells us about the available media.
 * - Upload is a secure media upload endpoint.
 */
app.use(mount("/music", music.router.routes()));
app.use(mount("/static", static.router.routes()));
app.use(mount("/describe", describe.router.routes()));
app.use(mount("/upload", upload.router.routes()));

/**
 * Start the music image cache pruner.
 */
music.pruner.start();

module.exports = app;
