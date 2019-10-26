/**
 * describe.js - Provides routes which describe the resource endpoints.
 */

const koaRouter = require("koa-router");
const fs = require("fs-extra");
const { STATIC } = require("../config");

const router = new koaRouter();

/**
 * Defines an array of names of the static resource groups.
 */
const groups = STATIC.map(group => group.NAME);

/**
 * Return all the static resource groups defined by the config file.
 *
 * Describes which groups are present, and at what path.
 */
router.get("/", async ctx => {
  ctx.body = {
    success: true,
    path: "/static/",
    groups: groups
  };
});

/**
 * For a specific group, return the files within it.
 */
router.get("/:group", async ctx => {
  /**
   * Get and escape the group from the request.
   */
  const group = ctx.params.group.toLowerCase();

  /**
   * Index of the requested group within the group names. Will be -1 if the requested group is not
   * a valid image group.
   */
  const index = groups.indexOf(group);

  /**
   * If the group has a valid path, return the names of the files.
   *
   * Else, tell the user the group did not exist on our system.
   */
  if (index !== -1) {
    /**
     * Read all filenames from the given dir.
     */
    const filenames = await fs.readdir("./media/static/" + group);

    /**
     * Return a successful response.
     */
    ctx.body = {
      success: true,
      path: "/static/" + group + "/",
      mimeType: STATIC[index].MIME_TYPE,
      files: filenames
    };
  } else {
    /**
     * Return a sad failure response.
     */
    ctx.body = {
      success: false,
      path: null,
      fileExtension: null,
      files: null
    };
  }
});

/**
 * Export the router.
 */
module.exports = {
  router: router
};
