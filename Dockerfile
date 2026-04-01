# ETAPA 1: Construção (Build)
FROM node:20-alpine AS builder
WORKDIR /app
# Copia os arquivos de dependência
COPY package*.json ./
# Instala TODAS as dependências (incluindo as de dev para compilar)
RUN npm ci
# Copia o resto do código
COPY . .
# Compila o TypeScript para JavaScript (pasta dist)
RUN npm run build

# ETAPA 2: Produção (Imagem final super leve)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Instala APENAS as dependências de produção (ignora devDependencies)
RUN npm ci --only=production
# Copia apenas a pasta "dist" gerada na etapa anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta do NestJS
EXPOSE 4448

# Comando para iniciar o servidor em produção
CMD ["node", "dist/main"]