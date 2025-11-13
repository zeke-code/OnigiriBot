# Base image is node 24 alpine to keep the container as light as possible
FROM node:24-alpine

# Set work directory
WORKDIR /onigiribot

# Copy all files contained in current host folder into container
COPY . .

# Install dependencies
RUN npm ci && npx prisma generate && npm run build

# Set container entrypoint to run the server on spin up
CMD ["npm", "run", "start"]
