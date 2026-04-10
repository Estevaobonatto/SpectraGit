# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache git openssh

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache git openssh openssl dumb-init

RUN addgroup -g 1001 -S spectragit && \
    adduser -S spectragit -u 1001 -G spectragit

WORKDIR /app

COPY --from=builder --chown=spectragit:spectragit /app/dist ./dist
COPY --from=builder --chown=spectragit:spectragit /app/node_modules ./node_modules
COPY --from=builder --chown=spectragit:spectragit /app/prisma ./prisma
COPY --from=builder --chown=spectragit:spectragit /app/package.json ./

RUN npx prisma generate && \
    mkdir -p /data/repositories && \
    mkdir -p /data/release-assets && \
    chown -R spectragit:spectragit /data/repositories && \
    chown -R spectragit:spectragit /data/release-assets

USER spectragit

EXPOSE 3000 2222

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
