# ---------- Etapa 1: build ----------
FROM node:20-slim AS builder
WORKDIR /app

# Instala dependências a partir do lockfile
COPY package*.json ./
RUN npm ci

# Copia o código e faz o build de produção
COPY . .

# URL da API embutida no bundle (variável NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_URL=http://localhost:3336/products
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Etapa 2: produção ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
