# Issue: Implementasi Swagger / OpenAPI Documentation

## Deskripsi

Tambahkan **Swagger UI** ke aplikasi agar developer lain bisa melihat dan mencoba endpoint API langsung dari browser tanpa perlu membaca kode atau dokumentasi terpisah.

Project ini menggunakan **Elysia.js** yang sudah memiliki plugin resmi bernama `@elysiajs/swagger`. Plugin ini otomatis menghasilkan dokumentasi OpenAPI dari route yang sudah didefinisikan (termasuk schema validasi dari `Elysia.t`).

---

## Teknologi yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| Web Framework | Elysia.js v1.4.28 |
| Swagger Plugin | `@elysiajs/swagger` |
| Runtime | Bun |
| Bahasa | TypeScript |

---

## Tahapan Implementasi

### Tahap 1: Install Package `@elysiajs/swagger`

Jalankan perintah berikut di terminal (pastikan sudah `cd` ke folder project):

```bash
bun add @elysiajs/swagger
```

Perintah ini akan mendownload package swagger untuk Elysia dan menambahkannya ke `package.json` serta `bun.lock`.

**Apa yang terjadi?**
- Package `@elysiajs/swagger` akan terinstall di `node_modules/`
- Di `package.json` akan muncul entry baru di `dependencies`
- File `bun.lock` akan terupdate

---

### Tahap 2: Register Plugin Swagger di `src/index.ts`

Buka file `src/index.ts`. Saat ini isinya seperti ini:

```ts
import { Elysia } from "elysia";
import { usersRoute } from "./routers/users-route";

export const app = new Elysia()
  .get("/", () => "Hello Elysia with Bun!")
  .use(usersRoute);
// ... sisanya
```

Kita perlu:

**a. Tambahkan import swagger** di baris 1:

```ts
import { swagger } from "@elysiajs/swagger";
```

**b. Panggil `.use(swagger(...))`** sebelum route lain. Tambahkan di antara `new Elysia()` dan `.get("/" ...)`:

```ts
export const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "API autentikasi user untuk aplikasi belajar-vibe-coding",
        },
        tags: [
          { name: "Users", description: "Endpoint terkait user & autentikasi" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .get("/", () => "Hello Elysia with Bun!")
  .use(usersRoute);
```

**Penjelasan setiap properti:**

| Properti | Nilai | Fungsi |
|----------|-------|--------|
| `path` | `"/docs"` | URL untuk membuka Swagger UI (buka `http://localhost:3000/docs`) |
| `info.title` | `"Belajar Vibe Coding API"` | Judul API yang tampil di header Swagger UI |
| `info.version` | `"1.0.0"` | Versi API |
| `info.description` | (text) | Deskripsi singkat API |
| `tags` | `[{ name: "Users", ... }]` | Label untuk mengelompokkan endpoint |
| `securitySchemes.bearerAuth` | (object) | Mendefinisikan skema autentikasi Bearer Token |

**Kenapa pakai `/docs` bukan `/swagger`?**
- Lebih pendek dan mudah diingat
- Tidak bentrok dengan route lain di aplikasi

**Kenapa `securitySchemes` perlu?**
- Supaya di Swagger UI muncul tombol "Authorize" di kanan atas
- User bisa memasukkan token di satu tempat, dan otomatis terkirim di semua request yang butuh autentikasi

---

### Tahap 3: Tambahkan Detail Dokumentasi di Setiap Route

Sekarang kita edit file `src/routers/users-route.ts`. Setiap route butuh properti `detail` dan `response`.

> **PENTING:** Jangan ubah kode di dalam handler (`async ({ body, set }) => { ... }`). Hanya tambahkan `detail` dan `response` di object konfigurasi.

#### 3a. Route `POST /register`

Cari route `POST /register`. Saat ini isinya:

```ts
.post(
  "/register",
  async ({ body, set }) => {
    try {
      const data = await registerUser(body);
      set.status = 201;
      return {
        status: "success",
        message: "User registered successfully",
        data,
      };
    } catch (error: any) {
      set.status = 400;
      return {
        status: "error",
        message: error.message ?? "Registration failed",
        data: null,
      };
    }
  },
  {
    body: t.Object({
      name: t.String({ maxLength: 100 }),
      email: t.String({ format: "email", maxLength: 100 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
  }
)
```

**Yang perlu diubah:** Tambahkan properti `detail` dan `response` di dalam object konfigurasi parameter ketiga (setelah `body`):

```ts
  {
    body: t.Object({
      name: t.String({ maxLength: 100 }),
      email: t.String({ format: "email", maxLength: 100 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
    detail: {
      summary: "Register user baru",
      description: "Mendaftarkan user baru dengan name, email, dan password.",
      tags: ["Users"],
    },
    response: {
      201: t.Object({
        status: t.String(),
        message: t.String(),
        data: t.Object({
          name: t.String(),
          email: t.String(),
        }),
      }),
      400: t.Object({
        status: t.String(),
        message: t.String(),
        data: t.Null(),
      }),
    },
  }
```

#### 3b. Route `POST /api/users/login`

Cari route ini (sekitar baris 41-64). Tambahkan `detail` dan `response` di parameter ketiga:

```ts
  {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 100 }),
      password: t.String({ minLength: 6, maxLength: 255 }),
    }),
    detail: {
      summary: "Login user",
      description: "Login dengan email dan password. Mengembalikan token session.",
      tags: ["Users"],
    },
    response: {
      200: t.Object({
        data: t.String(),
      }),
      401: t.Object({
        status: t.String(),
        message: t.String(),
      }),
    },
  }
```

#### 3c. Route `GET /api/users`

Route ini butuh autentikasi (Bearer Token). Perhatikan tambahan `security` di `detail`:

```ts
  {
    detail: {
      summary: "Ambil user saat ini",
      description: "Mengembalikan data user berdasarkan token Bearer yang dikirim di header Authorization.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
    },
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          createdAt: t.Date(),
        }),
      }),
      401: t.Object({
        status: t.String(),
        message: t.String(),
        data: t.Null(),
      }),
    },
  }
```

**Penjelasan `security: [{ bearerAuth: [] }]`:**
- `bearerAuth` harus sama persis dengan nama yang didefinisikan di `securitySchemes` di `src/index.ts`
- Array kosong `[]` berarti tidak ada scope (sesuai standar OAuth)
- Dengan ini, Swagger UI otomatis akan mengirim header `Authorization: Bearer <token>` saat user sudah klik "Authorize"

**Catatan `t.Date()`:**
- Elysia akan mengkonversi Date object ke format ISO string di response JSON
- Jika muncul error validasi type, ganti ke `t.String()` saja

#### 3d. Route `DELETE /api/users/logout`

```ts
  {
    detail: {
      summary: "Logout user",
      description: "Menghapus session token (logout). Membutuhkan Bearer Token.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
    },
    response: {
      200: t.Object({
        status: t.String(),
        message: t.String(),
      }),
      401: t.Object({
        status: t.String(),
        message: t.String(),
        data: t.Null(),
      }),
    },
  }
```

---

### Tahap 4: Test Swagger UI

Jalankan server:

```bash
bun run dev
```

Buka browser dan akses: **http://localhost:3000/docs**

Yang harus muncul:
1. **Halaman Swagger UI** dengan judul "Belajar Vibe Coding API"
2. **Daftar 4 endpoint** di bawah tag "Users"
3. Tiap endpoint punya **tombol "Try it out"**
4. **Tombol "Authorize"** di kanan atas

**Langkah verifikasi manual:**

1. **Klik "Try it out"** di `POST /register` → isi body JSON → klik Execute
2. **Klik "Try it out"** di `POST /api/users/login` → login → copy token dari response
3. **Klik "Authorize"** → paste token `Bearer <token>` → Authorize
4. **Klik "Try it out"** di `GET /api/users` → Execute (token otomatis terkirim)
5. **Klik "Try it out"** di `DELETE /api/users/logout` → Execute (token otomatis terkirim)

---

### Tahap 5: Pastikan Test Tetap Lolos

Swagger tidak mengubah logic aplikasi, tapi ada baiknya dicek:

```bash
bun test
```

Semua test case harus tetap **PASS**. Jika ada yang gagal, periksa:
- Apakah response structure berubah? (tidak boleh, karena kita hanya tambah `detail` dan `response` schema)
- Apakah ada error import? (pastikan `@elysiajs/swagger` terinstall)

---

## Checklist Implementasi

- [ ] **Tahap 1:** `bun add @elysiajs/swagger`
- [ ] **Tahap 2:** Edit `src/index.ts` — register plugin swagger dengan konfigurasi
- [ ] **Tahap 3a:** Edit `POST /register` — tambah `detail`, `response` (201, 400)
- [ ] **Tahap 3b:** Edit `POST /api/users/login` — tambah `detail`, `response` (200, 401)
- [ ] **Tahap 3c:** Edit `GET /api/users` — tambah `detail`, `response`, `security`
- [ ] **Tahap 3d:** Edit `DELETE /api/users/logout` — tambah `detail`, `response`, `security`
- [ ] **Tahap 4:** `bun run dev` → buka `http://localhost:3000/docs` → test semua endpoint
- [ ] **Tahap 5:** `bun test` — semua PASS

---

## Catatan Penting untuk Implementer

### 1. Jangan ubah handler logic
Hanya edit object konfigurasi route (parameter ketiga). Biarkan handler `async ({ body, set }) => { ... }` tetap seperti aslinya.

### 2. `response` schema hanya untuk dokumentasi
Elysia (tanpa plugin tambahan) **tidak memvalidasi response** — property `response` hanya memberitahu Swagger UI bentuk response yang diharapkan. Tapi tetaplah menulisnya akurat sesuai response asli.

### 3. Nama `bearerAuth` harus konsisten
Nama yang dipakai di:
- `src/index.ts`: `components.securitySchemes.bearerAuth`
- `src/routers/users-route.ts`: `detail.security: [{ bearerAuth: [] }]`

Jika salah satu beda, tombol Authorize tidak akan terhubung ke endpoint.

### 4. Format `t.Date()` vs `t.String()`
Untuk field `createdAt` yang tipenya Date:
- `t.Date()` akan menampilkan format `"2024-01-01T00:00:00.000Z"` di dokumentasi
- Jika muncul error validasi type, ganti ke `t.String()` karena response asli berupa string ISO

### 5. Path `/docs` vs `/swagger`
Kita pakai `/docs` biar lebih pendek. Bisa diubah ke `/swagger` atau `/api-docs` sesuai preferensi dengan mengganti nilai `path` di konfigurasi.

### 6. Swagger hanya aktif di development
Tidak ada masalah keamanan karena Swagger UI hanya bisa diakses jika server menyala. Untuk production, bisa dimatikan dengan env variable jika diperlukan di masa depan.

---

## Contoh Hasil Akhir

Setelah implementasi selesai, `http://localhost:3000/docs` akan menampilkan:

```
┌──────────────────────────────────────────────────┐
│  Belajar Vibe Coding API          [Authorize]    │
│  API autentikasi user untuk ...                  │
│                                                  │
│  ─── Users ──────────────────────────────        │
│  │ POST  /register              [Try it out] │   │
│  │ POST  /api/users/login       [Try it out] │   │
│  │ GET   /api/users             [Try it out] │   │
│  │ DELETE /api/users/logout     [Try it out] │   │
│  ────────────────────────────────────────────    │
└──────────────────────────────────────────────────┘
```

Setiap endpoint bisa diklik untuk melihat detail request/response schema dan tombol "Try it out" untuk mengirim request langsung dari browser.
