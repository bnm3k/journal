# syntax=docker/dockerfile:1
FROM node:20.15-bullseye-slim

# Use production node environment by default.
ENV NODE_ENV=production
ENV PORT=3000
ENV JWT_SECRET=foobar
ENV PG_URL="postgres://app:password@localhost:5432/journal"


WORKDIR /usr/src/app


# Dowload dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

RUN chown -R node:node /usr/src/app

# Run the application as a non-root user.
USER node

# # Copy the rest of the source files into the image.
COPY --chown=node:node . .

# # Expose the port that the application listens on by default
EXPOSE 3000

# # Run the application.
CMD  ["npm", "run", "start"]
