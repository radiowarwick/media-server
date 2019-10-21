const koaRouter = require("koa-router");
const fs = require("fs-extra");
const config = require("../config");

const router = new koaRouter();

/**
 * Defines an array of names of the groups of the static resources.
 */
const groupNames = config.STATIC.map(group => group.NAME);

/**
 * Return all the static image groups defined by the config file.
 *
 * Describes which groups are present, and at what path.
 */
router.get("/", async ctx => {
  ctx.body = {
    success: true,
    path: "/static/",
    endpoints: groupNames
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
   * Index of the endpoint within the group names. Will be -1 if the requested endpoint is not
   * an image group.
   */
  const index = groupNames.indexOf(endpoint);

  /**
   * If the endpoint has a valid path, return the names of the files.
   *
   * Else, tell the user the endpoint did not exist on our system.
   */
  if (index !== -1) {
    /**
     * Read all filenames from the given dir.
     */
    const filenames = await fs.readdir("./media/static/" + endpoint);

    /**
     * Return a successful response.
     */
    ctx.body = {
      success: true,
      path: "/static/" + endpoint + "/",
      fileExtension: config.STATIC[index].FILE_EXTENSION,
      files: filenames
    };
  } else {
    /**
     * Return a sad failure response.
     */
    ctx.body = { success: false, path: null, fileExtension: null, files: null };
  }
});

/**
 * Export the router.
 */
module.exports = {
  router: router
};
