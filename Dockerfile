FROM node:16.13.0-alpine as base

RUN mkdir -p frontend backend

FROM base as backend
WORKDIR backend

# build dependencies
COPY backend/package.json backend/yarn.lock ./
RUN yarn install

# build
COPY backend/ ./
RUN yarn build

FROM base as frontend
WORKDIR frontend

# build dependencies
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install

# build
COPY frontend/ ./
RUN yarn build

FROM base as release
WORKDIR /backend
ENV NODE_ENV production

COPY --from=backend /backend/dist /backend/dist
COPY --from=frontend /frontend/build /frontend/build

# runtime dependencies
COPY backend/package.json backend/yarn.lock /backend/
RUN yarn install --cache-folder /tmp/yarn-cache && rm -rf /tmp/yarn-cache

ENV PORT 3000
EXPOSE 3000

ENV ORIGINALS_ROOT_PATH /originals/
ENV THUMBNAILS_V2_ROOT_PATH /thumbnails_v2/
ENV NORMALS_ROOT_PATH /normals/
ENV ALBUMS_ROOT_PATH /albums/

CMD ["yarn", "start"]
