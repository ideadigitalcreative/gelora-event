# Event QR — Registrasi Event Berbasis QR Code

Aplikasi web fullstack Next.js 14 (App Router) untuk registrasi peserta event via QR, tiket digital, scan check-in, dan monitoring kehadiran.

**Stack:** Next.js 14 · TailwindCSS · Supabase (DB + Realtime + API) · Tanpa backend terpisah.

## Fitur

- **Event** — buat event (nama, tanggal, lokasi, kuota) + link registrasi `/register/[slug]`
- **Registrasi** — nama, no HP (unik per event), email & instansi opsional; generate nomor `REG-YYYY-XXXX` + `qr_token` UUID
- **Tiket digital** — QR Code (library `qrcode`) berisi `qr_token`, bisa diunduh
- **Scanner check-in** — kamera HP (`html5-qrcode`), validasi 1x pakai, status "Sudah check-in" jika duplikat
- **Dashboard admin** — list peserta, statistik (total/ hadir/ belum), pencarian & filter, **realtime** (Supabase Realtime), **export CSV**
- **Mobile friendly** — tombol besar, UI clean modern (biru–putih–orange)

## Struktur Folder

```
Event-app/
├── app/
│   ├── api/
│   │   ├── register/route.ts      # POST registrasi peserta
│   │   ├── checkin/route.ts       # POST check-in via qr_token
│   │   ├── events/route.ts        # POST buat event
│   │   └── export/route.ts        # GET export CSV
│   ├── admin/page.tsx             # Dashboard admin
│   ├── register/[slug]/           # Halaman registrasi + tiket QR
│   │   ├── page.tsx
│   │   └── register-form.tsx
│   ├── scan/page.tsx              # Scanner check-in
│   ├── globals.css                # Tailwind + komponen (btn, input, card)
│   ├── layout.tsx
│   ├── page.tsx                   # Beranda
│   └── not-found.tsx
├── components/
│   ├── qr-ticket.tsx              # Render QR tiket
│   ├── scanner.tsx                # Kamera + html5-qrcode
│   └── admin-dashboard.tsx        # UI admin (client, realtime)
├── lib/
│   ├── supabase.ts                # Supabase client (anon key)
│   ├── types.ts                   # Tipe Event/Participant/Checkin
│   ├── registration.ts            # Validasi HP, format REG-YYYY-XXXX, parse QR
│   └── export-csv.ts              # Builder CSV
├── supabase/schema.sql            # Schema database (manual fallback)
└── .env.local                     # Kredensial Supabase (tidak di-commit)
```

## Setup Supabase (Step-by-Step)

### 1. Buat project
1. Buka [supabase.com](https://supabase.com) → **New project**
2. Catat **Project URL** dan **anon/publishable key** (Settings → API)

### 2. Buat tabel
Buka **SQL Editor** di dashboard Supabase → jalankan seluruh isi `supabase/schema.sql` → **Run**.

> Skrip membuat tabel `events`, `participants`, `checkins`, index, RLS policy (public read/insert/update), dan mengaktifkan **Realtime** untuk `participants`.

### 3. Konfigurasi environment
Salin `.env.example` → `.env.local`, lalu isi:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
```

### 4. Jalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/admin` → **+ Event Baru** → salin link registrasi → buka `/register/<slug>` untuk mendaftar → buka `/scan` untuk check-in.

> Catatan kamera: gunakan **localhost** atau **HTTPS** (browser menolak kamera di HTTP selain localhost).

## Cara Kerja QR

1. Saat registrasi, server generate `qr_token` (UUID) unik → disimpan di tabel `participants`
2. QR berisi teks `qr_token` → ditampilkan di tiket digital
3. Scanner membaca QR → kirim token ke `/api/checkin`
4. API cek `status`:
   - `registered` → update jadi `checked_in` + insert tabel `checkins` → **Check-in Berhasil**
   - `checked_in` → tolak → **"Sudah check-in"** (QR tidak bisa dipakai 2x)
5. Dashboard admin menerima update via **Supabase Realtime** (tanpa refresh)

**Anti-duplikasi no HP:** constraint unik `(event_id, phone)` di database + validasi format HP Indonesia (`08xx` / `628xx`).

## Deploy ke Vercel

1. Push repo ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Event QR registration app"
   git branch -M main
   git remote add origin <url-repo-anda>
   git push -u origin main
   ```
2. Buka [vercel.com](https://vercel.com) → **Add New → Project** → import repo
3. Di **Environment Variables** isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** → selesai. Link: `https://<nama-project>.vercel.app`

### Checklist pasca-deploy
- Buka `/admin` → buat event → salin link registrasi
- Test daftar dari HP (buka link registrasi)
- Test `/scan` dari HP panitia (kamera butuh HTTPS → Vercel sudah HTTPS ✓)
- Cek dashboard update real-time saat ada scan

## Keamanan (Catatan)

Aplikasi ini memakai anon key + RLS longgar agar sederhana (tanpa backend/login). Untuk produksi serius, tambahkan **Supabase Auth** untuk `/admin` dan `/scan`, serta batasi RLS policy untuk operasi update/insert. Nomor registrasi `REG-YYYY-XXXX` mengandalkan retry saat terjadi tabrakan race condition.
