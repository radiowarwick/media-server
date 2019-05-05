const Koa = require("koa");
const mount = require("koa-mount");
const compress = require("koa-compress");
const music = require("./routes/music");
const static = require("./routes/static");
const describe = require("./routes/describe");

const app = new Koa();

/**
 * For each async peice of middleware, try it, and report on any errors.
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
 * Compress all compressable responses over 2KB. This is includes JPEGs and MP4s
 */
app.use(
  compress({
    filter: type => type === "image/jpeg" || "video/mp4",
    threshold: 2048,
    flush: require("zlib").Z_SYNC_FLUSH
  })
);

/**
 * Add a max-age of 14 days for all content. Allows for browser caching.
 */
app.use(async (ctx, next) => {
  await next();
  ctx.set("Cache-Control", "max-age=1209600");
});

/**
 * Define routes
 * - Music uses a cacheable router.
 * - Static is, well, static.
 * - Describe tells us about the avaliable media.
 */
app.use(mount("/music", music.router.routes()));
app.use(mount("/static", static.router.routes()));
app.use(mount("/describe", describe.router.routes()));

/**
 * Start the music image cache pruner.
 */
music.pruner.start();

module.exports = app;
