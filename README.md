# `raw-media-server`

A media server for all the many media outlets at RAW1251AM.

All images are returned as JPEGs (nicely compresses), and all videos as MP4s.

_NOTE, for all endpoints, file type is not required at the end of the request._

Yes: `request(static/exec/whall)` <- File is determined dynamically. Super!

NO: `request(static/exec/whall.jpg)` <- Don't put JPG! No! Stop!

_NOTE AGAIN, all other filetypes (png, mov) simply won't be served. We are strict about this._

## Installation

1. `git clone https://github.com/WillTheVideoMan/raw-media-server.git`
2. `cd raw-media-server`
3. `npm i`
4. Define env varables. PORT and DISCOGS_API_KEY are required.
5. `npm start`

## Endpoints

### /music/artist/:artist

Returns an image for a given artist (if found) or else a default placeholder image.

`:artist` can be any URI encoded string.

Example:
`request(/music/artist/tame%20impala);` will return an artist image for 'Tame Impala'.

### /music/track/:artist/:title

Returns a track image for a given artist and title (if found) or else the artists "profile" image, or else default placeholder image.

`:artist` and `:title` can be any URI encoded string.

Example:
`request(/music/track/tame%20impala/pateince);` will return an album art image for the track titled 'Pateince' by 'Tame Impala'.

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

## How are Artist/Track images sourced?

Good Question. There are a variety of providers out there which provide album art and artist profile images as a service. Some are free or paid, and some are better than others.

This server maintains a cache of images based on hash from the provider that is perodically pruned to ensure the most up to date images are served without having to query the provider for every request.

Currently we used [Discogs](https://www.discogs.com/developers/) as our provider. It is a community driven project, so whilst the diversity of avaliable images is wide, some of the images are lower in quality / photos of physical albums or CDs. Best part is that it's free and well maintained/supported.

However, if there ever came a point where Dicogs stopped working or went under, this server has been written so that you can easily plug in another data source (such as [Spotify](https://developer.spotify.com/), which would be super ideal but is also super expensive and has super picky [terms](https://developer.spotify.com/terms/#iv).).

##Developer's guide to switching providers

Ok, first job is to refer to line `230` of the file in `src/routes/music.js`. There is a function called `fetchRemoteImageURL`: this is our 'plug-n-play' function that can be impemented for any provider.

This function returns a string containing the URL of an image, or else null if your new provider can't supply one.

Your implementation should:

- Use some sort of arguments (maybe an object containing parameters?) to make a request for any image, both artist and album art (If your provider has multiple endpoints, you should could use a property in the parameters object as a flag to select endpoints).
- Properly parse any provider response to locate and return an image URL (for either an artist or album) from a JSON (or XML???) body.
- If the provider cannot provide such a URL, return null.
- Handle any authentication needed for such a provider. For example, Spotify has a [gosh darn auth flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow) to follow.
- Properly follow the async/await style, using the await keyword for any async call. This is important as Koa uses a neat try/catch middleware to catch any errors.

Finally, make sure that you update the rest of the code to feed in your new implementation's arguments. This includes the `resolveFilename` function (line `208`) and in each route where `resolveFilename` is called (lines `27`, `60` and `76`).

And that's it! Hopefully that wasn't too painful.
