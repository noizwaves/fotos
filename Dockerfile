FROM node:10.24-alpine

RUN mkdir -p frontend backend

ADD backend/package.json backend/yarn.lock backend/
RUN (cd backend && yarn install)
ADD backend/ backend/
RUN (cd backend && yarn build)

ENV NODE_ENV production
ADD frontend/ frontend/
RUN (cd frontend && yarn install && yarn build && rm -rf node_modules)

WORKDIR "backend"

ENV PORT 3000
EXPOSE 3000

ENV PHOTOS_ROOT_PATH /photos/
ENV THUMBNAILS_ROOT_PATH /thumbnails/
ENV ALBUMS_ROOT_PATH /albums/

CMD ["yarn", "start"]
