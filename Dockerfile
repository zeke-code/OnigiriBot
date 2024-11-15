FROM node:22

RUN apt-get update && apt-get install -y git ffmpeg

WORKDIR /app/

COPY . .

RUN npm install

CMD ["npm", "run", "start"]
