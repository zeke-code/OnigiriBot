# Base image is node 23 alpine to keep the container as light as possible
FROM node:23-alpine

RUN apk update && apk add git ffmpeg

WORKDIR /onigiribot/

COPY . .

RUN npm install

CMD ["npm", "run", "start"]
