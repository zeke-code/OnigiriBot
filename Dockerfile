FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Provide a dummy DATABASE_URL for the build step
# Prisma needs the variable to exist to validate the schema, but doesn't need a real connection yet.
ENV DATABASE_URL="postgresql://dummy:5432/mydb"

RUN npx prisma generate && npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]