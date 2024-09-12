FROM node:22

RUN apt-get update && apt-get install -y git && apt install -y ffmpeg

WORKDIR /usr/src/onigiribot

COPY . .

WORKDIR /usr/src/OnigiriBot

RUN npm install

CMD ["npm", "run", "start"]
