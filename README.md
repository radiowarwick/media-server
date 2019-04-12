# `raw-media-server`

A media server for all the many media outlets at RAW1251AM.

All images are returned as Portable Network Graphics (a browser's favorite), and all videos as MP4s.

_NOTE, for all endpoints, file type is not required at the end of the request._

Yes: `request(static/exec/whall)` <- File is determined dynamically. Super!

NO: `request(static/exec/whall.png)` <- Don't put PNG! No! Stop!

_NOTE AGAIN, all other filetypes (jpg, mov) simply won't be served. We are strict about this._

## Installation

1. `git clone https://github.com/WillTheVideoMan/raw-media-server.git`
2. `cd raw-media-server`
3. `npm i`
4. Define env varables. PORT and LASTFM_API_KEY are required.
5. `npm start`

## Endpoints

### /lastfm/artist/:artist

Returns an image for a given artist (if found) or else a default placeholder image.

`:artist` can be any URI encoded string.

Example:
`request(/lastfm/artist/tame%20impala);` will return an artist image for 'Tame Impala'.

### /lastfm/track/:artist/:track

Returns an image for a given artist and track (if found) or else a default placeholder image.

`:artist` and `:track` can be any URI encoded string.

Example:
`request(/lastfm/track/tame%20impala/pateince);` will return an album art image for the track 'Pateince' by 'Tame Impala'.

### /static/exec/:username

Returns an exec members images based on the member's username.

`:username` can be any member's username.

Example:
`request(static/exec/whall);` will return an image for exec member with username 'whall'.

### /static/shows/:showid

Returns show's cover image based on the show's ID.

`:showid` can be any show's ID.

Example:
`request(static/shows/5010);` will return an image for show with show ID '5010'.

### /static/marketing/:filename

Returns a marketing image based on the filename.

`:filename can be any valid filename`

Example:
`request(/static/marketing/varsity);` will return an image for the varsity marketing campain.

### /static/video/:filename

Returns a video based on the filename.

`:video` can be any video filename.

Example:
`request(static/video/timelapse);` will return a video with filename 'timelapse'.

### /describe

Returns a JSON representation of the media endpoints.

Example:
`request(/describe);` will return JSON containing of all endpoints present.

### /describe/:endpoint

Returns a JSON representation of all the files current present for a given endpoint.

`:endpoint` can be any valid endpoint.

Example:
`request(/describe/exec);` will return JSON containing all the media resources for a given endpoint.

## LastFM Integration Notes

This server maintains a cache of images from LastFM that is perodically pruned to ensure the most up to date images are served without having to query LastFM every request.

Using the artist and track strings, a hash is generated. Then, the server checks if there is an image file with a filename that matches the hash. If so, it serves the image from disk. Else, it will ask LastFM for an image URL, download it, and save it with a filename that matches the hash from before.

Next visit, the cached image will be served.

There is a also file pruner (which runs every day at midnight) which deletes files older than 14 days.
