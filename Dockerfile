# --- Estágio 1: Compilação (Builder) ---
FROM node:lts-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

# --- Estágio 2: Imagem Final (Produção) ---
FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 81
CMD ["node", "dist/server.js"]