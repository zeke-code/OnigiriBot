FROM node:22

RUN apt-get update && apt-get install -y git ffmpeg

WORKDIR /usr/src/OnigiriBot

COPY . .

RUN npm install

CMD ["npm", "run", "start"]
