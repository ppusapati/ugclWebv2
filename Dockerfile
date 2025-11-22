# Use Node.js with Debian slim as base image for building
FROM node:18-bullseye-slim AS build-env

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy app source
COPY . /app
WORKDIR /app

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm run build


# Use a lightweight distroless image for production
FROM gcr.io/distroless/nodejs18-debian11

WORKDIR /app

# Copy dependencies and built assets from build stage
COPY --from=build-env /app/node_modules ./node_modules
COPY --from=build-env /app/server ./server
COPY --from=build-env /app/dist ./dist

# Start the server
CMD ["server/entry.cloud-run.js"]
