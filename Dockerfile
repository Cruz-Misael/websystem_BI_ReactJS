# Etapa 1 - Build do React
FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2 - Servir com Nginx
FROM nginx:alpine

# Copia o build do React para a pasta pública do nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia configuração customizada (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
