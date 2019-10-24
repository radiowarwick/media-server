const koaRouter = require("koa-router");
const fs = require("fs-extra");
const config = require("../config");

const router = new koaRouter();

/**
 * Ensure that the static media directory exists locally on the server.
 */
fs.ensureDir("./media/static");

/**
 * For each static resource group, define a route which serves that resource group. Each route is constructed
 * by reading the configuration for each static resource group from the config file. The route will return
 * either a meaningful resource if it is found on disk, or else a default 'placeholder' image.
 */
config.STATIC.forEach(async group => {
  /**
   * Construct the route URL string based on the image group parameters.
   */
  const route = "/" + group.NAME + "/:filename." + group.FILE_EXTENSION;

  /**
   * Ensure that the directory for this group exists locally on the server.
   */
  await fs.ensureDir("./media/static/" + group.NAME);

  /**
   * Define the route.
   */
  router.get(route, async ctx => {
    /**
     * Set the correct content MIME type.
     */
    ctx.set("Content-Type", group.MIME_TYPE);

    /**
     * Normalize the filename.
     */
    filename = ctx.params.filename.toLowerCase();

    /**
     * Construct the path at which the file *should* be found.
     */
    const path =
      "./media/static/" +
      group.NAME +
      "/" +
      filename +
      "." +
      group.FILE_EXTENSION;

    /**
     * Boolean which defines if the file exists.
     */
    const exists = await fs.pathExists(path);

    /**
     * If exists, return the file.
     * Else, return default of a given file type.
     */
    if (exists) ctx.body = await fs.readFile(path);
    else
      ctx.body = await fs.readFile(
        "./media/defaults/" +
        group.DEFAULT_RESOURCE
      );
  });
});

/**
 * Export the router.
 */
module.exports = {
  router: router
};