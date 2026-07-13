# Belajar Vibe Coding

Aplikasi **REST API** untuk autentikasi user (register, login, logout, get current user) menggunakan **Bun**, **Elysia**, dan **Drizzle ORM** dengan database **MySQL**.

---

## Tech Stack & Library

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | [Bun](https://bun.sh) | 1.3.12+ |
| Bahasa | TypeScript | 5.0.4 |
| Web Framework | [Elysia](https://elysiajs.com) | 1.4.28 |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | 0.45.2 |
| Database Driver | `mysql2` | 3.22.0 |
| Migration CLI | `drizzle-kit` | 0.31.10 |
| Testing | `bun:test` (built-in) | — |

---

## Struktur Folder & Penamaan File

```
├── drizzle.config.ts          # Konfigurasi Drizzle Kit (migrasi)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts               # Entry point, inisialisasi Elysia app
│   ├── db/
│   │   ├── index.ts           # Koneksi MySQL + instance Drizzle
│   │   └── schema.ts          # Definisi tabel users & sessions
│   ├── routers/
│   │   └── users-route.ts     # Route definitions (register, login, dll.)
│   └── services/
│       └── users-service.ts   # Business logic user operations
└── tests/
    └── users.test.ts          # Integration test semua endpoint
```

**Konvensi penamaan:**
- File: **kebab-case** (`users-route.ts`, `users-service.ts`)
- Folder: lowercase plural (`routers`, `services`, `tests`, `db`)
- Interface: PascalCase (`RegisterPayload`)
- Fungsi/variabel: camelCase
- Endpoint path: prefix `/api/` untuk resource (kecuali `/register`)

---

## Schema Database

### Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` (auto-increment) | Primary Key |
| `name` | `varchar(100)` | NOT NULL |
| `email` | `varchar(100)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL (bcrypt hash) |
| `created_at` | `timestamp` | DEFAULT NOW() |
| `updated_at` | `timestamp` | DEFAULT CURRENT_TIMESTAMP ON UPDATE |

### Table: `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` (auto-increment) | Primary Key |
| `token` | `varchar(255)` | NOT NULL (UUID v4) |
| `user_id` | `bigint unsigned` | NOT NULL, FK → `users.id` |
| `expired_at` | `timestamp` | NOT NULL (default 24 jam) |

---

## API Endpoint

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| `POST` | `/register` | — | Register user baru |
| `POST` | `/api/users/login` | — | Login user, mengembalikan token |
| `GET` | `/api/users` | Bearer Token | Ambil data user saat ini |
| `DELETE` | `/api/users/logout` | Bearer Token | Hapus session (logout) |

---

## Setup Project

### Prasyarat

- Install [Bun](https://bun.sh) v1.3.12+
- MySQL server running

### Langkah-langkah

```bash
# 1. Clone repositori
git clone https://github.com/fernandamahesa/belajar-vibe-coding.git
cd belajar-vibe-coding

# 2. Install dependencies
bun install

# 3. Buat file .env
echo DATABASE_URL=mysql://user:password@localhost:3306/nama_database > .env

# 4. Push schema ke database (buat tabel)
bun run db:push
```

---

## Cara Run Aplikasi

```bash
# Development (dengan hot-reload)
bun run dev

# Production
bun run src/index.ts
```

Server berjalan di `http://localhost:3000` (ubah via env `PORT`).

---

## Cara Test Aplikasi

```bash
bun test
```

Tes menggunakan **bun:test** (test runner bawaan Bun) dan langsung memanggil `app.handle()` tanpa perlu server berjalan (integration test via `Elysia.handle()`).

Semua test ada di `tests/users.test.ts` dengan cakupan:

- **POST /register** — 5 test case (sukses, email duplikat, email invalid, password pendek, field kosong)
- **POST /api/users/login** — 5 test case (sukses, email tidak terdaftar, password salah, email invalid, field kosong)
- **GET /api/users** — 5 test case (sukses, tanpa token, token invalid, token expired, tanpa prefix Bearer)
- **DELETE /api/users/logout** — 5 test case (sukses, tanpa token, token invalid, double logout, tanpa prefix Bearer)
