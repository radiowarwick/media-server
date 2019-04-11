const Koa = require("koa");
const static = require("koa-static");
const mount = require("koa-mount");
const compress = require("koa-compress");
const lastfm = require("./routes/lastfm");

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
 * Mount routes.
 * - Lastfm uses a custom router.
 * - Exec is static.
 * - Video is static.
 * - Shows is static.
 */
app.use(mount("/lastfm", lastfm.router.routes()));
app.use(mount("/exec", static("./media/exec/")));
app.use(mount("/video", static("./media/video/")));
app.use(mount("/shows", static("./media/shows/")));

/**
 * Start the lastFM image cache pruner.
 */
lastfm.pruner.start();

module.exports = app;
