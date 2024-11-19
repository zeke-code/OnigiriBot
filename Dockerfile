# Base image is node 23 alpine to keep the container as light as possible
FROM node:23-alpine

# Install needed dependencies
RUN apk update && apk add ffmpeg

# Set work directory
WORKDIR /onigiribot/

# Copy all files contained in current host folder into container
COPY . .

# Install dependencies
RUN npm install

# Start the bot
CMD ["npm", "run", "start"]
