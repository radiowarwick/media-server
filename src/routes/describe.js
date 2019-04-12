const koaRouter = require("koa-router");
const fs = require("fs-extra");

const router = new koaRouter();

/**
 * Return all the static directories as 'image groups'.
 *
 * Describes which groups are present, and and what path.
 */
router.get("/", async ctx => {
  ctx.body = {
    success: true,
    path: "/static/",
    endpoints: await fs.readdir("./media/static/")
  };
});

/**
 * For a specific endpoint, return the files within it.
 */
router.get("/:endpoint", async ctx => {
  /**
   * Get and escape the endpoint from the request.
   */
  const endpoint = ctx.params.endpoint.toLowerCase();

  /**
   * Boolean to define if the endpoint has a valid path.
   */
  const exists = await fs.pathExists("./media/static/" + endpoint);

  /**
   * If the endpoint has a valid path, return the names of the files, and the path at which it is found,
   * removing the file type (as only PNGs are served).
   *
   * Else, tell the user the endpoint did not exist on our system.
   */
  if (exists) {
    /**
     * Read all filenames from the given dir.
     */
    const filenames = await fs.readdir("./media/static/" + endpoint);

    /**
     * Return a succesful response.
     */
    ctx.body = {
      success: true,
      path: "/static/" + endpoint + "/",
      files: filenames.map(f => f.replace(".png", "").replace(".mp4", ""))
    };
  } else {
    /**
     * Return a sad failure response.
     */
    ctx.body = { success: false, path: null, files: null };
  }
});

/**
 * Export the router.
 */
module.exports = {
  router: router
};
