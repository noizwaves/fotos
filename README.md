# fotos

A lightweight photo viewer inspired by iCloud Photos.

## Dependencies

1.  NodeJS 10
1.  Yarn
1.  Docker

## Getting started

### Bare metal

1.  Install dependencies
1.  Start the backend in one terminal
    1.  `$ cd backend`
    1.  `$ export PHOTOS_ROOT_PATH=/path/to/dev/photos`
    1.  `$ export THUMBNAILS_ROOT_PATH=/path/to/dev/thumbnails`
    1.  `$ export ALBUMS_ROOT_PATH=/path/to/dev/albums`
    1.  `$ npm start`
1.  Start the frontend in another terminal
    1.  `$ cd fronend`
    1.  `$ yarn start`
    1.  Open [http://localhost:3000]() in a web browser

### With Docker

1.  Build image locally `$ docker build -t fotos_dev:latest .`
1.  Start container locally
    ```
    $ docker run \
        -p 3000:3000 \
        -v $HOME/Pictures/iCloud_Photos:/photos:ro \
        -v $HOME/Pictures/iCloud_Albums:/albums:ro \
        -v `pwd`/thumbnails:/thumbnails \
        --name fotos \
        --hostname fotos \
        --rm \
        fotos_dev:latest
    ```
1.  Open [fotos](http://localhost:3000/)

## Deploying

Some example deployments with Docker can be found in `./examples`.

## Attributions

-  Fixture photos were downloaded from [Pexels](https://www.pexels.com)
