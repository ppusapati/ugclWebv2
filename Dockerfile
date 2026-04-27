# Use Node.js 20 on Debian 12 (glibc 2.36+) for Linux native bindings
FROM node:20-bookworm-slim AS build-env

# Activate pnpm via Corepack
RUN corepack enable

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy app source
COPY . /app

# Build the project
RUN pnpm run build


# Use distroless Node 20 on Debian 12 for runtime compatibility
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy dependencies and built assets from build stage
COPY --from=build-env /app/node_modules ./node_modules
COPY --from=build-env /app/server ./server
COPY --from=build-env /app/dist ./dist

# Start the server
CMD ["server/entry.cloud-run.js"]
