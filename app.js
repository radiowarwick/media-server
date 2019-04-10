const Koa = require("koa");
const koaRouter = require("koa-router");
const axios = require("axios");
const fs = require("fs-extra");
const crypto = require("crypto");

const app = new Koa();
const router = new koaRouter();

const endpoints = {
  artist:
    "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=e72f5e5eecceffa65784e10d18cfc5a5&format=json",
  album:
    "http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=e72f5e5eecceffa65784e10d18cfc5a5&format=json"
};

const maxAge = 604800;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { success: false, message: err.message };
    ctx.app.emit("error", err, ctx);
  }
});

router.get("/artist/:artist", async ctx => {
  const artist = normalise(ctx.params.artist);
  let hash = getHash(artist);

  const file = await getFileInfo("./media/artist/" + hash + ".png", maxAge);

  if (!file.exists || file.expired) {
    console.log("visiting lastFM");
    const response = await axios.get(endpoints.artist + "&artist=" + artist);
    const data = response.data;

    if (data.error) {
      hash = "default";
    } else {
      const imgObj = data.artist.image.find(image => image.size === "large");
      const path = "./media/artist/" + hash + ".png";
      await downloadImage(imgObj["#text"], path, file.exists);
    }
  }

  console.log("serving...");
  const img = await fs.readFile("./media/artist/" + hash + ".png");

  ctx.set("Content-Type", "image/png");
  ctx.set("Cache-Control", "max-age=" + maxAge);
  ctx.body = img;
});

app.on("error", (err, ctx) => {
  console.log(err.message);
});

app.use(router.routes());

app.listen(3000);

module.exports = app;

function normalise(string) {
  return string
    .trim()
    .toLowerCase()
    .replace(/\s{2,}/g, " ")
    .replace(/\s/g, "+");
}

function getHash(string) {
  return crypto
    .createHash("md5")
    .update(string)
    .digest("hex");
}

async function getFileInfo(path, maxAge) {
  return new Promise(resolve => {
    console.log("check");
    fs.stat(path, (err, stats) => {
      if (err) resolve({ exists: false, expired: false });
      else if (stats.birthtimeMs + maxAge * 1000 < Date.now())
        resolve({ exists: true, expired: true });
      else resolve({ exists: true, expired: false });
    });
  });
}

async function downloadImage(imgURL, path, exists) {
  console.log("downloading image");

  if (exists) await fs.unlink(path);

  const writer = fs.createWriteStream(path);

  const imgResponse = await axios({
    url: imgURL,
    method: "GET",
    responseType: "stream"
  });

  imgResponse.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
