# fotos

A lightweight photo viewer inspired by iCloud Photos.

## Dependencies

1.  NodeJS 10
1.  Docker

## Getting started

1.  Build image locally `$ docker build -t fotos_dev:latest .`
1.  Start container locally
    ```
    $ docker run \
        -p 3000:3000 \
        -v $HOME/Pictures/iCloud_Photos:/photos:ro \
        -v `pwd`/thumbnails:/thumbnails \
        --name fotos \
        --hostname fotos \
        --rm \
        fotos_dev:latest
    ```
1.  Open [fotos](http://localhost:3000/)

## Deploying

Some example deployments with Docker can be found in `./examples`.
