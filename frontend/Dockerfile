# 1. Aşama: Kodları derleme (Build)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Aşama: Derlenen kodları Nginx ile yayınlama
FROM nginx:alpine
# Vite build çıktısı genelde "dist" klasörüdür.
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]