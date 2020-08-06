FROM node:10.22-alpine

RUN mkdir -p frontend backend

ADD backend/package.json backend/package-lock.json backend/

RUN (cd backend && npm install)

ADD backend/** backend/

WORKDIR "backend"

ENV PORT 3000
EXPOSE 3000

CMD ["node", "index.js"]