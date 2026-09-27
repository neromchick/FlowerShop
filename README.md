# FlowerShop - Курсовая работа по СУБД

Интернет-магазин цветов на Clean Architecture с ASP.NET Core 8 + React/TypeScript.

## Технологический стек

### Backend
- **C# / .NET 8** / ASP.NET Core Web API
- **Clean Architecture** (Domain, Application, Infrastructure, WebAPI)
- **Entity Framework Core** (Code First + миграции)
- **PostgreSQL** база данных
- **ASP.NET Core Identity + JWT** (access + refresh токены)
- Роли: `Customer`, `Admin`
- **Локальное хранение файлов** (wwwroot/images) с возможностью перехода на S3

### Frontend
- **React 18 + TypeScript** (Vite)
- **Tailwind CSS** (v4)
- **React Router** для навигации
- **Axios** для API запросов с автоматическим обновлением токенов

## Структура проекта

```
FlowerShop/
├── src/
│   ├── FlowerShop.Domain/         # Доменные сущности и enum'ы
│   ├── FlowerShop.Application/    # Бизнес-логика, DTO, интерфейсы, сервисы, валидаторы
│   ├── FlowerShop.Infrastructure/ # EF Core, Identity, Auth, FileStorage, DbInitializer
│   └── FlowerShop.WebAPI/         # Контроллеры, Program.cs, настройки
├── frontend/                      # React + TypeScript + Vite + Tailwind
├── docker-compose.yml             # Docker Compose для локального запуска
└── README.md
```

## Сущности базы данных

- **User** - пользователи (Id, FullName, Email, PasswordHash, Phone, RoleId, CreatedAt)
- **Role** - роли (Customer, Admin)
- **Category** - категории товаров
- **Product** - товары (цена, остаток, фото, категория, активность)
- **Order** - заказы (гости + пользователи, статусы: New → Processing → Shipped → Delivered, Cancelled)
- **OrderItem** - позиции заказа (снимок названия товара, зафиксированная цена)
- **CartItem** - серверная корзина авторизованных пользователей
- **RefreshToken** - refresh токены для JWT
- **OrderStatusLog** - логи смены статусов заказов

## Функциональность

### Гость
- Каталог с фильтрами (категория, поиск, сортировка, пагинация)
- Корзина в localStorage
- Оформление заказа без регистрации (проверка остатков на сервере)

### Зарегистрированный пользователь
- Регистрация/вход с JWT + refresh токенами
- Синхронизация корзины при входе
- Личный кабинет с историей заказов

### Администратор
- CRUD категорий (с защитой от удаления непустых)
- CRUD товаров (загрузка фото, валидация, деактивация вместо удаления)
- Управление заказами (фильтры, смена статусов с логированием)
- Защита `[Authorize(Roles = "Admin")]` на уровне API

## Запуск проекта

### Вариант 1: Docker Compose (рекомендуется)

```bash
docker-compose up --build
```

Доступно:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

### Вариант 2: Локально

#### Предварительные требования
- .NET 8 SDK
- Node.js 18+
- PostgreSQL 14+

#### База данных
1. Создайте базу данных `flowershop` в PostgreSQL
2. Обновите строку подключения в `src/FlowerShop.WebAPI/appsettings.json`

#### Backend
```bash
cd src/FlowerShop.WebAPI
dotnet run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Тестовые данные

При первом запуске автоматически создаются:
- Роли: `Customer`, `Admin`
- Администратор: `admin@flowershop.local` / `Admin123!`
- 3 категории: Букеты, Комнатные растения, Подарочные наборы
- 4 тестовых товара

## API Endpoints

### Публичные
- `GET /api/catalog/categories` - активные категории
- `GET /api/catalog/products` - товары с фильтрами
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/refresh` - обновление токена
- `POST /api/orders` - создание заказа (гость или пользователь)

### Авторизованные (Customer)
- `GET /api/cart` - корзина пользователя
- `POST /api/cart/merge` - объединение корзины при входе
- `GET /api/orders/my` - мои заказы
- `GET /api/orders/my/{id}` - детали заказа
- `GET /api/auth/me` - профиль

### Администратор
- `GET/POST/PUT/DELETE /api/admin/categories` - категории
- `GET/POST/PUT/DELETE /api/admin/products` - товары
- `POST /api/admin/products/{id}/image` - загрузка фото
- `GET /api/admin/orders` - все заказы с фильтрами
- `GET /api/admin/orders/{id}` - детали заказа
- `PATCH /api/admin/orders/{id}/status` - смена статуса

## Особенности реализации

1. **Конкурентное списание остатков** - транзакция БД с проверкой `StockQuantity >= Quantity`
2. **ProductTitleSnapshot** - история заказов читаема даже после удаления/переименования товара
3. **Мягкое удаление товаров** - `IsActive = false` если есть заказы, физическое удаление только если заказов нет
4. **Валидация** - FluentValidation на всех мутирующих эндпоинтах
5. **Автообновление токенов** - axios interceptor перехватывает 401 и обновляет access token
6. **Защита админки** - на уровне API, а не только скрытием кнопок на фронте