# Base image is node 23 alpine to keep the container as light as possible
FROM node:24-alpine

# Install needed dependencies
RUN apk update && apk add ffmpeg

# Set work directory
WORKDIR /onigiribot/

# Copy all files contained in current host folder into container
COPY . .

# Install dependencies
RUN npm ci

# Set container entrypoint to run the server on spin up
CMD ["npm", "run", "start"]
