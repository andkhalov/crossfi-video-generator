# Используем Node.js 18 с Python
FROM node:18-bullseye

# Устанавливаем Python и системные зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем Node.js зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем requirements.txt и устанавливаем Python зависимости
COPY python/requirements.txt ./python/
RUN pip3 install -r python/requirements.txt

# Копируем исходный код
COPY . .

# Копируем схемы из родительской директории
COPY ../schema ./schema/
COPY ../domains_v6.json ./

# Создаем директории для видео
RUN mkdir -p raw_video ready_video

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем Next.js приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Создаем скрипт запуска
RUN echo '#!/bin/bash\n\
npx prisma db push --accept-data-loss\n\
npm start' > /app/start.sh && chmod +x /app/start.sh

# Запускаем приложение
CMD ["/app/start.sh"]
