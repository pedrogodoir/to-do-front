# to-do-front

Frontend of a game list application, built with **Nuxt**.

---

## Requirements

- Node.js >= 18
- npm

---

## Installation

#### 1. Clone the repository

```bash
git clone https://github.com/pedrogodoir/to-do-front.git
cd to-do-front
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Set up the environment

Create a `.env` file at the root of the project:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

#### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Pages

| Route        | Description                        |
|--------------|------------------------------------|
| `/`          | Login / Register                   |
| `/dashboard` | Game board (protected by auth)     |

---

## Features

- Authentication with JWT token stored in cookie
- Kanban-style board with 4 columns: **To Play**, **Playing**, **Finished**, **Dropped**
- Create games directly in any column
- Drag & drop cards between columns to update status and delete games on trash icon

---

## Useful commands

#### Development server
```bash
npm run dev
```

#### Production build
```bash
npm run build
```

#### Preview production build
```bash
npm run preview
```

#### Generate static site
```bash
npm run generate
```
