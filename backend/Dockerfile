FROM node:20

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate && pnpm install --shamefully-hoist && \
    pnpm rebuild @nestjs/core @prisma/engines bcrypt prisma unrs-resolver

COPY . .

RUN pnpm exec prisma generate
RUN pnpm build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
