#!/bin/bash

# 🚀 CrossFi Video Generator - Скрипт быстрого развертывания
# Использование: ./deploy.sh [production|development]

set -e

MODE=${1:-development}
echo "🚀 Развертывание в режиме: $MODE"

# Проверка зависимостей
echo "📋 Проверка зависимостей..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен. Установите Python 3.8+"
    exit 1
fi

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo "📝 Создание .env файла из шаблона..."
    cp env.template .env
    echo "⚠️  ВАЖНО: Отредактируйте .env файл и добавьте ваши API ключи!"
    echo "   - ANTHROPIC_API_KEY (обязательно)"
    echo "   - FAL_KEY (обязательно)"
    echo "   - RESEMBLE_AI_KEY (опционально)"
    echo "   - NEXTAUTH_SECRET (смените на случайную строку)"
    read -p "Нажмите Enter после настройки .env файла..."
fi

# Установка зависимостей
echo "📦 Установка Node.js зависимостей..."
npm install

echo "🐍 Установка Python зависимостей..."
pip3 install -r python/requirements.txt

# Инициализация базы данных
echo "🗄️  Инициализация базы данных..."
npx prisma generate
npx prisma db push

# Создание директорий для видео
echo "📁 Создание директорий..."
mkdir -p raw_video ready_video

# Создание демо профиля CrossFi
echo "👤 Создание демо профиля CrossFi..."
curl -X POST http://localhost:3000/api/client-profiles/seed 2>/dev/null || echo "⚠️  Не удалось создать демо профиль (сервер не запущен)"

if [ "$MODE" = "production" ]; then
    echo "🏭 Настройка для продакшена..."
    
    # Создание systemd сервиса
    echo "⚙️  Создание systemd сервиса..."
    sudo tee /etc/systemd/system/crossfi-video.service > /dev/null << EOF
[Unit]
Description=CrossFi Video Generator
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) $(which npm) run dev
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    echo "🔄 Активация сервиса..."
    sudo systemctl daemon-reload
    sudo systemctl enable crossfi-video
    
    echo "✅ Готово! Запуск: sudo systemctl start crossfi-video"
    echo "📊 Статус: sudo systemctl status crossfi-video"
    echo "📝 Логи: sudo journalctl -u crossfi-video -f"
    
else
    echo "🛠️  Запуск в режиме разработки..."
    echo "🌐 Приложение будет доступно по адресу: http://localhost:3000"
    echo "🔑 Логин: CrossFi / crossfi_2025"
    echo ""
    echo "Для остановки нажмите Ctrl+C"
    echo ""
    
    # Запуск в режиме разработки
    npm run dev
fi

echo "🎉 Развертывание завершено!"
