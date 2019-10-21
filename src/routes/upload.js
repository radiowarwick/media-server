const koaRouter = require("koa-router");
const basicAuth = require("koa-basic-auth");
const config = require("../config");

const router = new koaRouter();

router.use(
  basicAuth({ name: config.UPLOAD.USER, pass: config.UPLOAD.PASSWORD })
);

router.post("/", async ctx => {
  ctx.body = {
    destination: ctx.request.body.destination,
    filename: ctx.request.body.filename,
    file: ctx.request.files.image
  };
});

/**
 * Export the router.
 */
module.exports = {
  router: router
};
