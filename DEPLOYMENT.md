# 🚀 Инструкции по развертыванию

## Локальное развертывание (Development)

### Быстрый старт
```bash
# 1. Клонирование
git clone https://github.com/andkhalov/crossfi-video-generator
cd crossfi-video-generator

# 2. Настройка окружения
cp env.template .env
# Отредактируйте .env, добавив ваши API ключи

# 3. Установка зависимостей
npm install
pip install -r python/requirements.txt

# 4. Инициализация базы данных
npx prisma generate
npx prisma db push

# 5. Запуск
npm run dev
```

**Доступ:** http://localhost:3000  
**Логин:** CrossFi / crossfi_2025

## Удаленное развертывание (Production)

### Вариант 1: Простой VPS/Cloud Server

#### Требования к серверу:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 4GB (рекомендуется 8GB+)
- **CPU**: 2+ ядра
- **Диск**: 20GB+ свободного места
- **Сеть**: Публичный IP с открытыми портами

#### Порты для проброса:
- **3000** - основное приложение (Next.js)
- **22** - SSH доступ (стандартный)

#### Пошаговая установка:

```bash
# 1. Подключение к серверу
ssh root@your-server-ip

# 2. Обновление системы
apt update && apt upgrade -y

# 3. Установка Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 4. Установка Python 3.8+
apt install -y python3 python3-pip python3-venv

# 5. Установка Git
apt install -y git

# 6. Клонирование проекта
git clone https://github.com/andkhalov/crossfi-video-generator
cd crossfi-video-generator

# 7. Настройка окружения
cp env.template .env
nano .env  # Добавьте ваши API ключи

# 8. Установка зависимостей
npm install
pip3 install -r python/requirements.txt

# 9. Инициализация базы данных
npx prisma generate
npx prisma db push

# 10. Запуск в фоне
nohup npm run dev > app.log 2>&1 &
```

#### Настройка Nginx (рекомендуется):

```bash
# Установка Nginx
apt install -y nginx

# Создание конфигурации
cat > /etc/nginx/sites-available/crossfi-video << EOF
server {
    listen 80;
    server_name your-domain.com;  # Замените на ваш домен

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Активация конфигурации
ln -s /etc/nginx/sites-available/crossfi-video /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Вариант 2: Docker развертывание

#### Создание Dockerfile:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Установка Python
RUN apk add --no-cache python3 py3-pip

# Рабочая директория
WORKDIR /app

# Копирование файлов
COPY package*.json ./
COPY python/requirements.txt ./python/

# Установка зависимостей
RUN npm install
RUN pip3 install -r python/requirements.txt

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Открытие порта
EXPOSE 3000

# Запуск
CMD ["npm", "run", "dev"]
```

#### Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./raw_video:/app/raw_video
      - ./ready_video:/app/ready_video
      - ./dev.db:/app/dev.db
```

#### Запуск через Docker:

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Вариант 3: Cloud платформы

#### Heroku:
```bash
# Установка Heroku CLI
# Создание Procfile
echo "web: npm start" > Procfile

# Деплой
heroku create your-app-name
git push heroku main
```

#### Vercel:
```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

#### DigitalOcean App Platform:
- Создайте новое приложение
- Подключите GitHub репозиторий
- Настройте переменные окружения
- Деплой автоматический

## 🔧 Настройка переменных окружения

### Обязательные переменные:
```env
# API ключи (получить на соответствующих сайтах)
ANTHROPIC_API_KEY="sk-ant-api03-your-key"
FAL_KEY="your-fal-key"

# Безопасность
NEXTAUTH_SECRET="your-super-secret-32-chars-minimum"
NEXTAUTH_URL="https://your-domain.com"

# База данных
DATABASE_URL="file:./dev.db"

# Python
PYTHON_ENV_PATH="/usr/bin/python3"
```

### Опциональные переменные:
```env
# Улучшение звука
RESEMBLE_AI_KEY="your-resemble-key"

# Окружение
NODE_ENV="production"
```

## 🛡️ Безопасность

### Рекомендации:
1. **Никогда не коммитьте `.env` файл**
2. **Используйте сильные пароли для NEXTAUTH_SECRET**
3. **Настройте HTTPS (Let's Encrypt)**
4. **Ограничьте доступ к серверу по IP**
5. **Регулярно обновляйте зависимости**

### Настройка HTTPS:
```bash
# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Получение сертификата
certbot --nginx -d your-domain.com

# Автообновление
crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Мониторинг

### Проверка статуса:
```bash
# Проверка процесса
ps aux | grep node

# Проверка логов
tail -f app.log

# Проверка портов
netstat -tlnp | grep :3000
```

### Автозапуск (systemd):
```bash
# Создание сервиса
cat > /etc/systemd/system/crossfi-video.service << EOF
[Unit]
Description=CrossFi Video Generator
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/crossfi-video-generator
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Активация
systemctl enable crossfi-video
systemctl start crossfi-video
```

## 🚨 Устранение неполадок

### Частые проблемы:

1. **Порт 3000 занят:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Ошибки Python модулей:**
   ```bash
   pip3 install --upgrade -r python/requirements.txt
   ```

3. **Проблемы с базой данных:**
   ```bash
   npx prisma db push --force-reset
   ```

4. **Ошибки API ключей:**
   - Проверьте правильность ключей в `.env`
   - Убедитесь что ключи активны и имеют достаточный баланс

### Логи для отладки:
```bash
# Логи приложения
tail -f app.log

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Логи системы
journalctl -u crossfi-video -f
```

## 📈 Масштабирование

### Для высоких нагрузок:
1. **Используйте PostgreSQL вместо SQLite**
2. **Настройте Redis для кэширования**
3. **Добавьте Load Balancer**
4. **Используйте CDN для статических файлов**
5. **Настройте мониторинг (Prometheus + Grafana)**

---

**Готово к продакшену! 🚀**

Для получения поддержки обратитесь к команде разработки CrossFi.
