# ---- Base build image ----
FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true
# Install build deps (remove if not needed for native modules)
RUN apk add --no-cache python3 make g++

# ---- Dependencies layer ----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- Build layer ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- Production runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app
# Copy only what is needed at runtime
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Copy i18n translation files (app.module.ts expects them at src/i18n/)
COPY --from=build /app/src/i18n ./src/i18n

USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]
