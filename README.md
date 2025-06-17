# MyAch Pro Tir List - Backend

Backend-сервер для приложения списка тиров MyAch Pro.

## Установка

```bash
npm install
```

## Настройка окружения

Создайте файл `.env` в корневой директории проекта со следующим содержимым:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:admin@localhost:5432/myach-pro-tir-list-test?schema=public
```

## База данных

### Миграции

Создание миграций базы данных:

```bash
npm run db:migrate
```

### Заполнение тестовыми данными

```bash
npm run db:seed
```

### Prisma Studio (графический интерфейс для управления БД)

```bash
npm run db:studio
```

## Запуск для разработки

```bash
npm run dev
```

## Сборка и запуск для продакшена

```bash
npm run build
npm start
```

## API Endpoints

### Основные

- `GET /api/health` - Проверка статуса API

### Пользователи

- `GET /api/users` - Получить список всех пользователей
- `GET /api/users/:id` - Получить пользователя по ID
- `POST /api/users` - Создать нового пользователя
- `PUT /api/users/:id` - Обновить данные пользователя
- `DELETE /api/users/:id` - Удалить пользователя
