module.exports = {
  DISCOGS_API_KEY: process.env.DISCOGS_API_KEY || "",
  PORT: process.env.PORT || 3000,
  UPLOAD: {
    USER: process.env.UPLOAD_USER || "",
    PASSWORD: process.env.UPLOAD_PASSWORD || ""
  },
  MUSIC: {
    MIME_TYPE: "image/jpeg",
    FILE_EXTENSION: "jpg",
    DEFAULT_RESOURCE: "raw-logo-only",
    PIXEL_DIMENSIONS: {
      WIDTH: 640,
      HEIGHT: 640
    }
  },
  STATIC: [
    {
      NAME: "exec",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-logo",
      PIXEL_DIMENSIONS: {
        WIDTH: 640,
        HEIGHT: 640
      }
    },
    {
      NAME: "shows",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-logo-only",
      PIXEL_DIMENSIONS: {
        WIDTH: 640,
        HEIGHT: 640
      }
    },
    {
      NAME: "marketing",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-banner",
      PIXEL_DIMENSIONS: {
        WIDTH: 1920,
        HEIGHT: 1080
      }
    },
    {
      NAME: "icons",
      MIME_TYPE: "image/png",
      FILE_EXTENSION: "png",
      DEFAULT_RESOURCE: "raw-icon",
      PIXEL_DIMENSIONS: {
        WIDTH: 16,
        HEIGHT: 16
      }
    },
    {
      NAME: "video",
      MIME_TYPE: "video/mp4",
      FILE_EXTENSION: "mp4",
      DEFAULT_RESOURCE: "raw-timelapse",
      PIXEL_DIMENSIONS: {
        WIDTH: 1920,
        HEIGHT: 1080
      }
    }
  ]
};
