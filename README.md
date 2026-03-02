# Memesite — лента мемчиков для NLauncher

Одностраничный сайт: форма загрузки мема (картинка, ник, подпись) и лента.

- **Локально:** картинки в `uploads/`, данные в `data/memes.json`.
- **На Vercel:** картинки заливаются в [ImgBB](https://imgbb.com/) (прямые ссылки), список мемов — в **Vercel KV**.

## Запуск локально

```bash
npm install
npm start
```

Или: `.\run.ps1`  
Открой http://localhost:3000

Опционально: задай `IMGBB_API_KEY` в `.env`, чтобы «Отправить» заливало картинки в ImgBB и сохраняло прямую ссылку (иначе картинка сохраняется в `uploads/`).

## Деплой на Vercel

1. Репозиторий с memesite подключи к [Vercel](https://vercel.com) (Import Project). Корень проекта — папка **memesite** (или корень репо, если весь репо — memesite).

2. **Переменные окружения** в настройках проекта:
   - **IMGBB_API_KEY** — ключ с [api.imgbb.com](https://api.imgbb.com/) (бесплатно, без карты).
   - **KV** — в Vercel: Storage → Create Database → KV, затем в проекте подключи эту KV; переменные `KV_REST_API_URL` и `KV_REST_API_TOKEN` подставятся сами.

3. Деплой: Vercel соберёт проект и поднимет API (`/api/upload`, `/api/memes`). Главная страница — `index.html` с `/`.

## API для лаунчера

**GET /api/memes** — JSON-лента: `id`, `imageUrl` (прямая ссылка на картинку), `nickname`, `caption`, `date`.
