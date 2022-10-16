# fotos

A lightweight photo viewer inspired by iCloud Photos.

![Screenshot of fotos showing photos by day](./docs/screenshots/photos.png)

## Dependencies

1.  NodeJS 16
1.  Yarn
1.  Docker (optional)

Easily install the correct versions using [asdf](https://asdf-vm.com) by running `$ asdf install`

## Getting started

### Bare metal

1.  Install dependencies
1.  `$ cp backend/.envrc.template backend/.envrc`
1.  `$ overmind start`
1.  Open [fotos](http://localhost:3000) in a web browser

### With Docker

1.  Start container locally
    ```
    $ docker run \
        -p 3000:3000 \
        -v $(pwd)/fixtures/photos:/photos:ro \
        -v $(pwd)/fixtures/albums:/albums:ro \
        -it \
        --rm \
        ghcr.io/noizwaves/fotos:latest
    ```
1.  Open [fotos](http://localhost:3000/) in a web browser

## Deploying

Some example deployments with Docker can be found in `./examples`.

## Attributions

Fixture photos were downloaded from [Pexels](https://www.pexels.com).
