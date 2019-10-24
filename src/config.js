/**
 * config.js - Defines the configuration of the media server through a series of constant definitions.
 */

module.exports = {
  /**
   * Define some global constants which define required values for the server's function.
   * This includes API keys and resource upload user credentials.
   */
  DISCOGS_API_KEY: process.env.DISCOGS_API_KEY || "",
  PORT: process.env.PORT || 3000,
  UPLOAD: {
    USER: process.env.UPLOAD_USER,
    PASSWORD: process.env.UPLOAD_PASSWORD
  },
  /**
   * Defines the parameters of the "music" resource endpoint, including artist profile snaps and 
   * track album arts.
   */
  MUSIC: {
    MIME_TYPE: "image/jpeg",
    FILE_EXTENSION: "jpg",
    DEFAULT_RESOURCE: "raw-logo-only.jpg",
    PIXEL_DIMENSIONS: {
      WIDTH: 640,
      HEIGHT: 640
    }
  },
  /**
   * Define the parameters of all static resource endpoints. To define a new static endpoint, simply
   * include a new resource endpoint object in this array. The resource endpoint will be instantiated when the
   * server is restarted.
   * 
   * All resource endpoint objects must follow a constant shape:
   * 
   * {
   *    NAME: string,
   *    MIME_TYPE: string,
   *    FILE_EXTENSION: string,
   *    DEFAULT_RESOURCE: string, 
   *    PIXEL_DIMENSIONS: {
   *      WIDTH: integer,
   *      HEIGHT: integer
   *    }
   * }
   * 
   * NAME can be any string.
   * MIME_TYPE can be any valid IANA MIME type.
   * FILE_EXTENSION can be any valid file extension which matches the MIME type.
   * DEFAULT_RESOURCE can be the filename and valid extension of any default resource listed in the './media/defaults' folder.
   * PIXEL_DIMENSIONS can be an object with keys WIDTH and HEIGHT with any integer values.
   * 
   * Some common sense must be used to match the MIME type, file extension, and default resource filename extension.
   */
  STATIC: [{
      NAME: "exec",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-logo.jpg",
      PIXEL_DIMENSIONS: {
        WIDTH: 640,
        HEIGHT: 640
      }
    },
    {
      NAME: "shows",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-logo-only.jpg",
      PIXEL_DIMENSIONS: {
        WIDTH: 640,
        HEIGHT: 640
      }
    },
    {
      NAME: "marketing",
      MIME_TYPE: "image/jpeg",
      FILE_EXTENSION: "jpg",
      DEFAULT_RESOURCE: "raw-banner.jpg",
      PIXEL_DIMENSIONS: {
        WIDTH: 1920,
        HEIGHT: 1080
      }
    },
    {
      NAME: "icons",
      MIME_TYPE: "image/png",
      FILE_EXTENSION: "png",
      DEFAULT_RESOURCE: "raw-icon.png",
      PIXEL_DIMENSIONS: {
        WIDTH: 16,
        HEIGHT: 16
      }
    },
    {
      NAME: "video",
      MIME_TYPE: "video/mp4",
      FILE_EXTENSION: "mp4",
      DEFAULT_RESOURCE: "raw-timelapse.mp4",
      PIXEL_DIMENSIONS: {
        WIDTH: 1920,
        HEIGHT: 1080
      }
    }
  ]
};