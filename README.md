# `raw-media-server`

A media server for all the many media outlets at RAW.

## Installation
1. `git clone https://github.com/WillTheVideoMan/raw-media-server.git`
2. `cd raw-media-server`
3. `npm i`
4. Define env varables. PORT and LASTFM_API_KEY are required.
5. `npm start`

## Endpoints

### /lastfm/artist/:artist

Returns an image for a given artist (if found) or else a default placeholder image. 

`:artist` can be any URI encoded string. Note, `.png` is NOT required. 

Example:
`request(/lastfm/artist/tame%20impala);` will return an artist image for 'Tame Impala'.

### lastfm/track/:artist/:track

Returns an image for a given artist and track (if found) or else a default placeholder image.

`:artist` and `:track` can be any URI encoded string. Note, `.png` is NOT required. 

Example:
`request(/lastfm/track/tame%20impala/pateince);` will return an album art image for the track 'Pateince' by 'Tame Impala'.

### exec/:username.png

Returns an exec members images based on the member's username appended by `.png`.

`:username.png` can be any member's username. Note, `.png` is required.

Example:
`request(/exec/whall.png);` will return the image for exec member with username 'whall'.

### shows/:showid.png

Returns show's cover image based on the shows ID appended by `.png`.

`:showid.png` can be any show's ID. Note, `.png` is required.

Example:
`request(/shows/5010.png);` will return the image for show with show ID '5010'.

### video/:video.mp4

Returns a video base on the filename appended by `.mp4`.

`:video.mp4` can be any video filename. Note, `.mp4` is required.

Example:
`request(/video/timelapse.mp4);` will return a video with filename 'timelapse'.
