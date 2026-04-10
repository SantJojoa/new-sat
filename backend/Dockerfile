FROM node:20

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --shamefully-hoist && \
    pnpm rebuild @nestjs/core @prisma/engines bcrypt prisma unrs-resolver

COPY . .

RUN pnpm exec prisma generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
