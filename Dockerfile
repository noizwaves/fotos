FROM node:10.22-alpine

RUN mkdir -p frontend backend
ENV NODE_ENV production

ADD backend/package.json backend/package-lock.json backend/
RUN (cd backend && npm install)
ADD backend/ backend/

ADD frontend/ frontend/
RUN (cd frontend && yarn install && yarn build && rm -rf node_modules)

WORKDIR "backend"

ENV PORT 3000
EXPOSE 3000

ENV GALLERY_PATH /gallery/
ENV THUMBNAILS_PATH /thumbnails/

CMD ["node", "index.js"]
