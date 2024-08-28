FROM node:22

RUN apt-get update && apt-get install -y git && apt install -y ffmpeg

WORKDIR /usr/src/

RUN git clone https://github.com/zeke-code/OnigiriBot.git

WORKDIR /usr/src/OnigiriBot

RUN npm install

CMD ["node", "index.js"]
