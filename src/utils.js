const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");

const compressPNG = async (path, dir) => {
  await imagemin([path], dir, {
    plugins: [imageminPngquant({ quality: [0.6, 0.8] })]
  });
};

module.exports = {
  compressPNG: compressPNG
};
