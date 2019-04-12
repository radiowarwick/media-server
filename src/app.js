const Koa = require("koa");
const mount = require("koa-mount");
const compress = require("koa-compress");
const lastfm = require("./routes/lastfm");
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
 * Compress all compressable responses over 2KB.
 */
app.use(
  compress({
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
 * - Lastfm uses a caching router.
 * - Exec is static.
 * - Video is static.
 * - Shows is static.
 */
app.use(mount("/lastfm", lastfm.router.routes()));
app.use(mount("/static", static.router.routes()));
app.use(mount("/describe", describe.router.routes()));

/**
 * Start the lastFM image cache pruner.
 */
lastfm.pruner.start();

module.exports = app;
