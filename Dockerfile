FROM node:18-alpine

WORKDIR /app

# Устанавливаем зависимости для PDF (если понадобится в будущем)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ghostscript \
    fontconfig \
    freetype

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем папку для загрузок
RUN mkdir -p uploads

# Устанавливаем права
RUN chmod 755 uploads

# Открываем порт
EXPOSE 3001

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3001
ENV JWT_SECRET=your-secret-key-change-in-production

# Команда запуска
CMD ["node", "server.js"]