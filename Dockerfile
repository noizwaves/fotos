FROM node:10.22-alpine

RUN mkdir -p frontend backend

ADD backend/package.json backend/package-lock.json backend/
RUN (cd backend && npm install)
ADD backend/ backend/

ADD frontend/package.json frontend/yarn.lock frontend/
RUN (cd frontend && yarn install)
ADD frontend/ frontend/
RUN (cd frontend && yarn build)

WORKDIR "backend"

ENV PORT 3000
EXPOSE 3000

ENV GALLERY_PATH /gallery/
ENV THUMBNAILS_PATH /thumbnails/

CMD ["node", "index.js"]
