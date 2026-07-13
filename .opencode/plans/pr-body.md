## Deskripsi

Menambahkan Swagger UI ke aplikasi menggunakan `@elysiajs/swagger` untuk mendokumentasikan API endpoint secara otomatis.

## Perubahan

- Install package `@elysiajs/swagger`
- Register plugin Swagger di `src/index.ts` dengan konfigurasi title, tags, dan security scheme Bearer Token
- Tambahkan `detail`, `response`, dan `security` di semua route di `src/routers/users-route.ts`

## Cara Test

1. `bun run dev`
2. Buka http://localhost:3000/docs
3. Coba "Try it out" di setiap endpoint
4. Klik "Authorize" untuk input Bearer Token

## Checklist

- [x] Swagger UI bisa diakses di /docs
- [x] Semua 4 endpoint muncul dengan deskripsi
- [x] Bearer Auth bisa digunakan via tombol Authorize
- [x] Response schema sesuai response asli
