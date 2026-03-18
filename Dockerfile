# ===============================
# Build stage
# ===============================
FROM node:20-alpine AS build
WORKDIR /app

# Build-time 環境變數（docker build --build-arg VITE_APP_ENV=PROD）
ARG VITE_APP_ENV=PROD
ARG VITE_API_BASE=""

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_API_BASE=$VITE_API_BASE

# 先只複製 lock 檔，利用 Docker layer cache 加速重複 build
COPY package.json package-lock.json ./
RUN npm ci

# 複製原始碼並 build
COPY . .
RUN npm run build


# ===============================
# Runtime stage
# ===============================
FROM nginx:alpine

# 使用自訂 nginx.conf（支援 SPA routing + gzip）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 複製靜態資產
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
