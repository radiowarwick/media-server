# `media-server`

A media server for all the many media resources at RAW 1251AM.

## Installation

1. `git clone https://github.com/radiowarwick/media-server.git`
2. `cd media-server`
3. `npm i`
4. Install HandbrakeCLI:
   1. `sudo add-apt-repository --yes ppa:stebbins/handbrake-releases`
   2. `sudo apt-get update -qq`
   3. `sudo apt-get install -qq handbrake-cli`
5. Define env varables. PORT and DISCOGS_API_KEY are required.
6. `npm start`

## Dynamic Endpoints

Dynamic resources involve logic which attempts to produce a relevant image from an external resource. If no resource is found, a default 'placeholder' image will be returned.

### `GET` /music/artist/:artist.jpg

Returns an image for a given artist (if found) or else a default placeholder image.

`:artist` can be any URI encoded string.

Example: return an artist image for 'Tame Impala'.

```bash
curl --request GET \
  --url http://path_to_server/music/artist/Tame%20Impala.jpg
```

### `GET` /music/track/:artist/:title.jpg

Returns a track image for a given artist and title (if found) or else the artists "profile" image, or else default placeholder image.

`:artist` and `:title` can be any URI encoded string.

Example: return an album art image for the track titled 'Patience' by 'Tame Impala'.

```bash
curl --request GET \
  --url http://path_to_server/music/track/Tame%20Impala/Patience.jpg
```

## Static Endpoints

For all static resources, this server will attempt to return a relevant resource, or else if the resource does not exist, it will return a default 'placeholder' resource. This prevents clients from having no resource to display at all; clients can make use of this media server's 'describe' endpoint to learn about what resources are available.

### `GET` /static/exec/:username.jpg

Returns an exec members images based on the member's username.

`:username` can be any member's username.

Example: return an image for exec member with username 'whall'.

```bash
curl --request GET \
  --url http://path_to_server/static/exec/whall.jpg
```

### `GET` /static/shows/:showid.jpg

Returns show's cover image based on the show's ID.

`:showid` can be any show's ID.

Example: return an image for show with show ID '5010'.

```bash
curl --request GET \
  --url http://path_to_server/static/shows/5010.jpg
```

### `GET` /static/marketing/:filename.jpg

Returns a marketing image based on the filename.

`:filename can be any valid filename`

Example: return an image for the varsity marketing campaign.

```bash
curl --request GET \
  --url http://path_to_server/static/marketing/varsity.jpg
```

### `GET` /static/video/:filename.mp4

Returns a video based on the filename.

`:video` can be any video filename.

Example: return a video with filename 'timelapse.mp4'.

```bash
curl --request GET \
  --url http://path_to_server/static/video/timelapse.mp4
```

### `GET` /static/icons/:icon.png

Returns an icon based on the filename.

`:icon` can be any icon filename.

Example: return an icon with filename 'accept.png'.

```bash
curl --request GET \
  --url http://path_to_server/static/icons/accept.png
```

## Describe

### `GET` /describe

Returns a JSON representation of the media groups.

Example: return JSON containing of all groups present.

```bash
curl --request GET \
  --url http://localhost:8910/describe
```

```json
{
  "success": true,
  "path": "/static/",
  "groups": ["exec", "shows", "marketing", "icons", "video"]
}
```

### `GET` /describe/:group

Returns a JSON representation of all the files current present for a given group.

`:group` can be any valid group.

Example: return JSON containing all the media resources for a the exec resource group.

```bash
curl --request GET \
  --url http://localhost:8910/describe/exec
```

```json
{
  "success": true,
  "path": "/static/exec/",
  "mimeType": "image/jpeg",
  "files": []
}
```

## Upload

Upload and convert media to any of the given static resource group.

All upload routes are protected by basic HTTP auth. The credentials are defined by ENV variables `UPLOAD_USER` and `UPLOAD_PASSWORD`.

### `POST` /upload/:group

POST a resource to a given group, assigning that resource a given filename.

`:group` can be any valid group.

Example: Upload a video to the video group with filename "mydude".

```bash
curl --request POST \
  --url http://path_to_server/upload/video \
  --header 'authorization: Basic dXBsb2FkX3VzZXI6aGFja21l' \
  --header 'content-type: multipart/form-data; boundary=---011000010111000001101001' \
  --form resource= \
  --form filename=mydude
```

```json
{
  "success": true,
  "path": "/static/video/mydude.mp4"
}
```

A resource at `http://path_to_server/static/video/mydude.mp4` will be generated.

## How are Artist/Track images sourced?

Good Question. There are a variety of providers out there which provide album art and artist profile images as a service. Some are free or paid, and some are better than others.

This server maintains a cache of images based on hash from the provider that is perodically pruned to ensure the most up to date images are served without having to query the provider for every request.

Currently we used [Discogs](https://www.discogs.com/developers/) as our provider. It is a community driven project, so whilst the diversity of avaliable images is wide, some of the images are lower in quality / photos of physical albums or CDs. Best part is that it's free and well maintained/supported.

However, if there ever came a point where Dicogs stopped working or went under, this server has been written so that you can easily plug in another data source (such as [Spotify](https://developer.spotify.com/), which would be super ideal but is also super expensive and has super picky [terms](https://developer.spotify.com/terms/#iv).).

## Developer's guide to switching providers

Ok, first job is to refer to line `261` of the file in `src/routes/music.js`. There is a function called `fetchRemoteImageURL`: this is our 'plug-n-play' function that can be impemented for any provider.

This function returns a string containing the URL of an image, or else null if your new provider can't supply one.

Your implementation should:

- Use some sort of arguments (maybe an object containing parameters?) to make a request for any image, both artist and album art (If your provider has multiple endpoints, you should could use a property in the parameters object as a flag to select endpoints).
- Properly parse any provider response to locate and return an image URL (for either an artist or album) from a JSON (or XML???) body.
- If the provider cannot provide such a URL, return null.
- Handle any authentication needed for such a provider. For example, Spotify has a [gosh darn auth flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow) to follow.
- Properly follow the async/await style, using the await keyword for any async call. This is important as Koa uses a neat try/catch middleware to catch any errors.

Finally, make sure that you update the rest of the code to feed in your new implementation's arguments. This includes the `resolveFilename` function and in each route where `resolveFilename` is called.

And that's it! Hopefully that wasn't too painful.
