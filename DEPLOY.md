# Гайд: memesite на GitHub и Vercel

## Часть 0. Один раз настроить Git Bash (имя, email и доступ к GitHub)

### 0.1. Кто ты в коммитах (имя и email)

В Git Bash выполни (подставь свои имя и почту):

```bash
git config --global user.name "Твой ник или имя"
git config --global user.email "твоя@почта.com"
```

Почта может быть любой, но если хочешь, чтобы коммиты светились на GitHub — укажи почту, привязанную к аккаунту GitHub.

### 0.2. Войти в GitHub из Git Bash (чтобы пушить без ввода пароля каждый раз)

**Вариант А — через браузер (проще):**

1. В Git Bash делаешь, например: `git push origin main`.
2. Git спросит логин и пароль. **Пароль от аккаунта GitHub вводить нельзя** — он больше не принимается.
3. Нужен **Personal Access Token**:
   - GitHub → правый верхний угол → **Settings** → внизу слева **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
   - **Generate new token (classic)**.
   - Note: например `git-bash`, срок — на твоё усмотрение, галочки: **repo** (полный доступ к репозиториям).
   - **Generate token** — скопируй токен (показывается один раз).
4. В Git Bash при запросе пароля вставь **этот токен** вместо пароля.
5. Если включишь **Git Credential Manager** (часто уже есть в Git for Windows), логин и токен сохранятся, и дальше пушить можно без ввода.

**Вариант Б — сохранить учётные данные в Windows:**

После того как один раз ввёл логин и токен:

```bash
git config --global credential.helper store
```

Следующий раз при `git push` введёшь логин и токен ещё раз — они сохранятся в файле, дальше Git будет подставлять их сам.

Итого: **авторизоваться в Git Bash = один раз указать `user.name` и `user.email` и один раз при первом `git push` ввести логин GitHub и Personal Access Token вместо пароля.**

---

## Часть 1. Залить memesite на GitHub через Git Bash

### 1.1. Если у тебя ещё нет репозитория на GitHub

1. Зайди на [github.com](https://github.com), залогинься.
2. **New repository** (или «+» → New repository).
3. Название, например: `memesite`.
4. **Public**, галочку «Add a README» можно не ставить.
5. **Create repository** — GitHub покажет страницу с URL вида `https://github.com/ТВОЙ_НИК/memesite.git`.

### 1.2. Открыть Git Bash и перейти в папку memesite

```bash
cd путь/к/memesite
```

Пример, если memesite лежит в `E:\Nlauncher\NLauncher\memesite`:

```bash
cd /e/Nlauncher/NLauncher/memesite
```

### 1.3. Инициализировать Git (если в этой папке ещё нет .git)

```bash
git init
```

### 1.4. Добавить удалённый репозиторий

Подставь свой ник и название репо (как на GitHub):

```bash
git remote add origin https://github.com/ТВОЙ_НИК/memesite.git
```

Пример:

```bash
git remote add origin https://github.com/tv1p/memesite.git
```

Если `origin` уже был добавлен и нужно заменить URL:

```bash
git remote set-url origin https://github.com/ТВОЙ_НИК/memesite.git
```

### 1.5. Добавить все файлы и сделать первый коммит

```bash
git add .
git status
git commit -m "memesite: лента мемчиков для NLauncher"
```

### 1.6. Отправить на GitHub

Для репо с именем ветки `main`:

```bash
git branch -M main
git push -u origin main
```

Если GitHub просит логин/пароль — используй **Personal Access Token** вместо пароля (Settings → Developer settings → Personal access tokens). Или войди через браузер, если Git предложит.

---

## Часть 2. Задеплоить на Vercel, чтобы всё работало

### 2.1. Создать Blob Store в Vercel (хранилище для ленты мемов, бесплатный тариф)

1. Зайди на [vercel.com](https://vercel.com), залогинься (удобно через «Continue with GitHub»).
2. Вверху: **Storage** (или в левом меню).
3. **Create Database** → выбери **Blob** (не KV/Redis — Blob входит в бесплатный тариф).
4. Имя, например: `memesite-blob`, доступ **Public** или **Private** — на твой выбор (в коде используется `public`).
5. **Create**.
6. Откроется хранилище. Нажми **Connect to Project** и выбери проект memesite (его создадим в шаге 2.2) или «Skip» — подключишь потом. Vercel сам добавит переменную `BLOB_READ_WRITE_TOKEN` в проект.

### 2.2. Импортировать проект с GitHub

1. На [vercel.com](https://vercel.com): **Add New…** → **Project**.
2. **Import Git Repository** → выбери **GitHub** и дай доступ к репозиториям, если просят.
3. Найди репо **memesite** и нажми **Import**.

### 2.3. Настройки проекта перед деплоем

- **Root Directory:** если в репо только папка memesite — оставь пустым; если memesite лежит внутри репо (например, `memesite/` как подпапка), укажи `memesite`.
- **Framework Preset:** оставь **Other** (или None).
- **Build Command:** можно оставить пустым или `npm install`.
- **Output Directory:** пусто.
- **Install Command:** `npm install`.

Переменные окружения для ImgBB уже зашиты в коде; для Blob токен подставится автоматически, если хранилище подключено к проекту.

### 2.4. Подключить Blob Store к проекту

1. В проекте Vercel: вкладка **Storage** (или **Settings** → **Storage**).
2. **Connect Store** → выбери созданный Blob **memesite-blob**.
3. Выбери проект **memesite** и **Connect**. Vercel добавит переменную `BLOB_READ_WRITE_TOKEN` в проект.

### 2.5. Задеплоить

1. Нажми **Deploy**.
2. Дождись окончания сборки (обычно 1–2 минуты).
3. Vercel выдаст ссылку вида `https://memesite-xxx.vercel.app` — открой её.

### 2.6. Проверить, что всё работает

- Открывается главная с формой.
- Выбираешь картинку, ник, подпись → **Отправить** → картинка появляется в ленте (она заливается на ImgBB, ссылка сохраняется в Blob в файле `memes.json`).
- В лаунчере можно дергать **GET** `https://твой-проект.vercel.app/api/memes` — должен отдаваться JSON с лентой и прямыми ссылками на картинки.

---

## Краткая шпаргалка (уже всё настроено)

**Git Bash — залить изменения и обновить сайт на Vercel:**

```bash
cd /e/Nlauncher/NLauncher/memesite
git add .
git commit -m "обновление"
git push origin main
```

После `git push` Vercel сам сделает новый деплой (если репо подключён к проекту).

**Если memesite лежит не в отдельном репо, а внутри NLauncher:**

Тогда в Vercel при импорте укажи **Root Directory:** `memesite`, чтобы собирался только содержимое папки memesite (там есть `package.json` и `api/`).
