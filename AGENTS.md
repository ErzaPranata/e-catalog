MASTER PROMPT — FULL-STACK E CATALOG & ADMIN CONTROL PANEL
1. PERAN DAN TUJUAN
Bertindak sebagai Senior Full-Stack Engineer, Software Architect, Database Engineer, UI/UX Engineer, dan QA Engineer.
Bangun aplikasi web katalog produk yang lengkap, berfungsi, responsif, aman, dan siap dikembangkan untuk production.
Nama proyek: e-catalog
Jangan hanya memberikan contoh kode, tutorial, mockup, rancangan, atau daftar langkah. Kerjakan implementasi langsung pada file proyek di direktori kerja yang tersedia.
Mode kerja: autonomous implementation.
Lakukan analisis proyek yang sudah ada, buat rencana internal, implementasikan seluruh fitur, jalankan migration dan seed sesuai kondisi lingkungan, jalankan lint/typecheck/test/build, perbaiki error yang ditemukan, dan dokumentasikan hasil akhirnya.
Jangan berhenti setelah membuat frontend statis atau backend skeleton. Jangan mengklaim suatu fitur selesai apabila hanya berupa placeholder.
Jika terdapat keputusan teknis yang tidak dijelaskan, pilih default yang aman, sederhana, konsisten, dan terdokumentasi. Jangan menunggu konfirmasi untuk keputusan implementasi biasa.
Jika kredensial eksternal belum tersedia, implementasikan integrasinya secara lengkap, buat .env.example, dan tandai hanya langkah yang memang membutuhkan kredensial pengguna sebagai pending. Tetap selesaikan semua bagian lain yang dapat dikerjakan.
2. TECHNOLOGY STACK
Gunakan stack berikut:
Frontend
•	React.
•	TypeScript dengan strict mode.
•	Vite.
•	Tailwind CSS.
•	React Router.
•	TanStack Query untuk server state.
•	Zustand untuk state keranjang jika diperlukan.
•	React Hook Form dan Zod untuk formulir.
•	Lucide React untuk ikon.
•	Komponen UI reusable dan aksesibilitas yang baik.
Backend
•	Node.js.
•	NestJS dengan Express adapter.
•	TypeScript.
•	REST API dengan prefix /api/v1.
•	Prisma ORM.
•	DTO validation menggunakan class-validator dan class-transformer.
•	Swagger/OpenAPI melalui @nestjs/swagger.
•	Konfigurasi environment yang divalidasi ketika aplikasi dimulai.
Jangan membangun dua backend terpisah menggunakan Express dan NestJS. Gunakan NestJS dengan Express adapter.
Database dan storage
•	PostgreSQL melalui Supabase.
•	Prisma sebagai ORM utama.
•	Supabase Storage untuk foto produk.
•	Prisma migrations dan seed.
•	Gunakan koneksi PostgreSQL yang sesuai dengan lingkungan Supabase, termasuk konfigurasi pooled connection dan direct connection bila diperlukan.
Jangan menggunakan SQLite atau database mock sebagai pengganti implementasi production.
Pengujian
•	Jest dan Supertest untuk backend.
•	Vitest dan React Testing Library untuk frontend.
•	Pengujian end-to-end tambahan bila lingkungan mendukung.
Workspace
Gunakan pnpm workspace/monorepo dengan struktur:
apps/web
apps/api
packages/shared-types
docs
Gunakan versi paket yang kompatibel satu sama lain. Periksa versi aktual dan dokumentasi paket jika akses internet tersedia. Hindari penggunaan API deprecated.
3. KONSEP APLIKASI
Aplikasi memiliki dua area utama.
A. Halaman pelanggan
Pelanggan tidak perlu membuat akun dan tidak perlu login.
Pelanggan dapat:
1.	Melihat katalog produk.
2.	Melihat kategori produk.
3.	Mencari produk.
4.	Memfilter dan mengurutkan produk.
5.	Membuka detail produk.
6.	Melihat galeri gambar.
7.	Memilih variasi produk.
8.	Memeriksa harga dan ketersediaan stok.
9.	Menambah, mengurangi, dan menghapus item dari keranjang.
10.	Melihat subtotal dan total keranjang.
11.	Mengisi formulir checkout.
12.	Membuat pesanan dan membuka WhatsApp untuk melanjutkan komunikasi dengan toko.
B. Admin Control Panel
Admin harus login untuk mengakses seluruh halaman pengelolaan.
Admin dapat:
1.	Melihat dashboard.
2.	CRUD kategori.
3.	CRUD produk.
4.	Mengelola harga dan stok.
5.	Mengelola variasi produk.
6.	Mengunggah, mengubah urutan, memilih foto utama, dan menghapus gambar.
7.	Mengatur produk aktif/nonaktif dan status publikasi.
8.	Melihat daftar pesanan.
9.	Melihat detail pesanan.
10.	Memfilter dan mencari pesanan.
11.	Mengubah status pesanan sesuai transisi yang diperbolehkan.
12.	Mengelola pengaturan toko dan nomor WhatsApp.
13.	Melihat status pembayaran yang dicatat oleh admin.
14.	Mengelola akun admin sesuai role yang diizinkan.
Jangan menyediakan halaman admin tanpa perlindungan autentikasi.
4. DESAIN UI/UX
Buat desain yang modern, bersih, profesional, dan responsif.
Gunakan bahasa Indonesia sebagai bahasa utama antarmuka.
Halaman pelanggan
•	Header dengan logo/nama toko, navigasi kategori, kolom pencarian, dan ikon keranjang.
•	Hero/banner yang dikelola melalui konfigurasi atau data admin jika fitur banner diimplementasikan.
•	Grid kartu produk yang responsif.
•	Kartu produk menampilkan foto, nama, harga, kategori, dan indikator stok yang relevan.
•	Halaman detail menampilkan galeri, deskripsi, pilihan variasi, harga, stok, kuantitas, dan tombol tambah ke keranjang.
•	Keranjang menampilkan thumbnail, nama produk, variasi, harga, kuantitas, subtotal per item, dan total.
•	Checkout menampilkan formulir pelanggan dan ringkasan pesanan.
•	Footer dengan informasi toko dan kontak.
Admin Control Panel
•	Layout dengan sidebar dan header.
•	Sidebar: Dashboard, Kategori, Produk, Pesanan, Pengaturan Toko, dan Admin jika role mengizinkan.
•	Dashboard menampilkan jumlah produk aktif, kategori aktif, pesanan baru, pesanan dalam proses, dan stok menipis.
•	Tabel dengan pencarian, filter, pagination, loading state, empty state, dan error state.
•	Form tambah/edit menggunakan validasi.
•	Modal konfirmasi untuk penghapusan dan tindakan penting.
•	Toast notification untuk hasil tindakan.
•	Status pesanan memakai badge yang konsisten.
•	Layout harus nyaman digunakan di desktop dan perangkat mobile.
Jangan membuat UI yang hanya terlihat bagus tetapi tombolnya tidak bekerja.
Semua tombol, tautan, filter, formulir, dialog, pagination, dan aksi harus memiliki perilaku nyata.
5. STRUKTUR DATABASE DAN PRISMA
Buat Prisma schema lengkap dan tervalidasi.
Gunakan UUID untuk primary key, timestamp, relasi yang tepat, indeks, unique constraints, dan Decimal untuk nilai uang.
Buat model minimal berikut.
Category
•	id
•	name
•	slug
•	description
•	isActive
•	sortOrder
•	createdAt
•	updatedAt
•	relasi ke Product
Product
•	id
•	categoryId
•	name
•	slug
•	sku
•	description
•	basePrice Decimal
•	stock
•	isPublished
•	createdAt
•	updatedAt
•	relasi ke Category, ProductImage, ProductVariant, dan OrderItem
ProductImage
•	id
•	productId
•	imageUrl
•	storagePath bila dibutuhkan untuk penghapusan file
•	altText
•	sortOrder
•	isPrimary
•	createdAt
ProductVariant
•	id
•	productId
•	name
•	sku
•	price Decimal
•	stock
•	attributes Json opsional
•	isActive
•	createdAt
•	updatedAt
•	relasi ke Product dan OrderItem
Order
•	id
•	orderNumber unik
•	customerName
•	phone
•	address
•	notes opsional
•	subtotal Decimal
•	total Decimal
•	status
•	paymentStatus
•	timestamps
•	relasi ke OrderItem
OrderItem
•	id
•	orderId
•	productId opsional sesuai kebijakan retensi
•	variantId opsional
•	productName sebagai snapshot
•	variantName sebagai snapshot jika ada
•	sku sebagai snapshot
•	unitPrice Decimal sebagai snapshot
•	quantity
•	lineTotal Decimal
•	timestamps bila diperlukan
AdminUser
•	id
•	name
•	email unik
•	passwordHash
•	role
•	isActive
•	createdAt
•	updatedAt
StoreSetting
•	id
•	storeName
•	storeDescription opsional
•	whatsappNumber
•	currency
•	storeAddress opsional
•	announcement opsional
•	updatedAt
Tambahkan enum untuk status pesanan dan pembayaran.
Status pesanan:
•	PENDING
•	CONFIRMED
•	PROCESSING
•	SHIPPED
•	COMPLETED
•	CANCELLED
Status pembayaran:
•	UNPAID
•	PAID
•	REFUNDED
•	NOT_APPLICABLE jika memang dibutuhkan.
Gunakan nama model Prisma yang konsisten. Nama tabel database dapat menggunakan snake_case melalui @@map.
Buat relasi dengan foreign key dan aturan penghapusan yang aman.
Jangan menghapus riwayat pesanan ketika produk diarsipkan atau dihapus secara logis.
Terapkan aturan data:
•	Slug kategori dan produk unik.
•	SKU unik.
•	Email admin unik.
•	Nomor pesanan unik.
•	Harga tidak boleh negatif.
•	Kuantitas harus bilangan bulat positif.
•	Stok tidak boleh negatif.
•	Maksimal satu foto utama untuk satu produk melalui validasi service dan constraint database yang sesuai.
•	Kategori yang masih dipakai tidak dapat dihapus secara paksa.
•	Produk yang sudah dipesan sebaiknya diarsipkan, bukan dihapus permanen.
Jika menggunakan PostgreSQL constraint tambahan yang tidak dapat dinyatakan langsung dalam Prisma, dokumentasikan dan masukkan pada migration SQL yang sesuai.
6. ATURAN PRODUK DAN VARIASI
Dukung dua mode produk.
Produk tanpa variasi
Gunakan Product.basePrice dan Product.stock.
Produk dengan variasi
Gunakan harga dan stok ProductVariant untuk variasi yang dipilih.
Jangan menghitung atau mengurangi stok pada Product dan ProductVariant sekaligus untuk item yang sama.
Tentukan dan dokumentasikan aturan validasi kedua mode tersebut. Backend harus menolak pilihan variasi yang tidak aktif, tidak valid, atau tidak mencukupi stoknya.
Kartu produk dan halaman detail harus menggunakan harga serta ketersediaan yang benar. Untuk produk dengan variasi harga berbeda, tampilkan rentang harga atau harga awal yang jelas.
7. BACKEND REST API
Implementasikan endpoint yang nyata, menggunakan DTO, validasi, error handling, dan response yang konsisten.
Authentication
•	POST /api/v1/auth/login
•	POST /api/v1/auth/logout
•	GET /api/v1/auth/me
•	Endpoint refresh sesi/token jika mekanisme autentikasi yang dipilih memerlukannya.
Public catalog
•	GET /api/v1/categories
•	GET /api/v1/products
•	GET /api/v1/products/:slug
•	GET /api/v1/products/:slug/related jika relevan.
Daftar produk mendukung:
•	page
•	limit
•	search
•	category
•	minPrice
•	maxPrice
•	sortBy
•	sortOrder
•	ketersediaan stok
Validasi semua query parameter. Batasi maksimum page size.
Admin categories
•	GET /api/v1/admin/categories
•	POST /api/v1/admin/categories
•	GET /api/v1/admin/categories/:id
•	PATCH /api/v1/admin/categories/:id
•	DELETE /api/v1/admin/categories/:id
Admin products
•	GET /api/v1/admin/products
•	POST /api/v1/admin/products
•	GET /api/v1/admin/products/:id
•	PATCH /api/v1/admin/products/:id
•	DELETE /api/v1/admin/products/:id
Implementasikan CRUD variasi melalui endpoint yang terorganisasi, misalnya /api/v1/admin/products/:id/variants.
Product images
Implementasikan endpoint untuk upload, pengurutan, pemilihan foto utama, dan penghapusan gambar.
Orders
•	POST /api/v1/orders untuk membuat pesanan dari checkout publik.
•	GET /api/v1/admin/orders
•	GET /api/v1/admin/orders/:id
•	PATCH /api/v1/admin/orders/:id/status
•	PATCH /api/v1/admin/orders/:id/payment-status bila diperlukan.
Settings
•	GET /api/v1/settings/public
•	GET /api/v1/admin/settings
•	PATCH /api/v1/admin/settings
Endpoint admin wajib dilindungi guard autentikasi dan otorisasi.
Jangan menampilkan data rahasia admin kepada publik.
Tambahkan pagination, sorting, pencarian, filter, DTO validation, response code yang tepat, dan dokumentasi Swagger.
Dokumentasikan seluruh endpoint, parameter, DTO, enum, response, dan error penting. Swagger UI harus dapat dibuka melalui URL yang dikonfigurasi, misalnya /api/docs.
8. AUTENTIKASI DAN KEAMANAN
Implementasikan keamanan yang sesuai untuk aplikasi production.
•	Password disimpan dalam hash menggunakan Argon2id atau bcrypt dengan konfigurasi yang aman.
•	Jangan menyimpan password dalam plaintext.
•	Jangan membuat endpoint registrasi admin publik.
•	Akun admin awal dibuat melalui seed atau prosedur bootstrap yang aman.
•	Jangan menanam password default atau rahasia ke dalam source code.
•	Gunakan guard untuk seluruh endpoint admin.
•	Validasi role dan status akun pada backend.
•	Jika memakai cookie, gunakan konfigurasi HttpOnly, Secure di production, SameSite yang sesuai, dan perlindungan CSRF bila relevan.
•	Jika memakai JWT, gunakan access token berumur pendek dan mekanisme refresh yang aman bila dibutuhkan.
•	Jangan menyimpan token autentikasi sensitif di localStorage apabila mekanisme cookie aman dapat digunakan.
•	Tambahkan rate limiting pada login dan endpoint sensitif.
•	Batasi ukuran request dan upload.
•	Validasi tipe file gambar berdasarkan isi file dan MIME type; jangan hanya mempercayai ekstensi.
•	Sanitasi nama file dan jangan menerima path file arbitrer.
•	Cegah SQL injection, mass assignment, akses lintas role, dan kebocoran error internal.
•	Gunakan CORS berdasarkan konfigurasi environment.
•	Jangan mengekspos Supabase service-role key pada frontend.
•	Jangan mengekspos DATABASE_URL, JWT secret, password admin, atau kredensial lain ke browser.
•	Terapkan konfigurasi security headers yang sesuai.
Semua validasi bisnis penting harus berada di backend, bukan hanya frontend.
9. CHECKOUT WHATSAPP
Implementasikan alur pemesanan berikut.
1.	Pelanggan memilih produk dan variasi.
2.	Pelanggan mengatur kuantitas di keranjang.
3.	Pelanggan membuka checkout.
4.	Pelanggan mengisi nama, nomor telepon, alamat, dan catatan.
5.	Frontend mengirim daftar ID produk/variasi dan kuantitas ke backend.
6.	Backend mengambil harga, nama, variasi, dan stok dari database.
7.	Backend memvalidasi seluruh item dan menghitung total sendiri.
8.	Backend membuat order number unik dan menyimpan Order serta OrderItem dalam transaksi.
9.	Backend mengembalikan order number, total yang telah diverifikasi, dan informasi yang diperlukan untuk membuka WhatsApp.
10.	Frontend membuka https://wa.me/ menggunakan nomor toko dan pesan yang sudah di-URL-encode.
11.	Pesan berisi nomor pesanan, nama pelanggan, item, variasi, kuantitas, harga satuan, subtotal, total, alamat, dan catatan.
12.	Tampilkan fallback jika browser memblokir pembukaan WhatsApp.
Gunakan nomor WhatsApp bisnis dari StoreSetting, dalam format internasional yang sesuai dengan format wa.me, tanpa tanda plus, spasi, atau tanda baca yang tidak diperbolehkan.
Nomor telepon pelanggan harus divalidasi dan dinormalisasi sesuai kebutuhan.
Penting:
•	Membuka WhatsApp tidak berarti pesan telah terkirim.
•	Jangan mengklaim bahwa pesanan telah dikonfirmasi melalui WhatsApp.
•	Jangan menyatakan pembayaran telah diterima hanya karena checkout selesai.
•	Status awal order adalah PENDING.
•	Jika WhatsApp tidak tersedia, pesanan yang tersimpan tetap dapat dilihat admin.
•	Jangan menerima harga atau total dari frontend sebagai sumber kebenaran.
•	Tambahkan idempotency atau perlindungan double submission untuk mencegah pesanan ganda akibat klik berulang atau retry.
•	Jangan menggunakan WhatsApp API berbayar kecuali memang dikonfigurasi secara eksplisit. Gunakan deep link wa.me untuk kebutuhan ini.
10. STOK DAN TRANSAKSI
Buat kebijakan stok yang konsisten dan dokumentasikan.
Rekomendasi:
•	Checkout membuat order PENDING tanpa langsung mengurangi stok.
•	Admin mengonfirmasi pesanan.
•	Pada transisi PENDING ke CONFIRMED, backend memeriksa dan mengurangi stok secara atomik dalam transaksi.
•	Pesanan yang dibatalkan setelah stok dikurangi harus mengembalikan stok tepat satu kali.
•	Perubahan status harus mengikuti transisi yang diizinkan.
•	Jangan mengizinkan status COMPLETED berubah sembarangan.
•	Jangan mengurangi stok kembali apabila transisi yang sama diulang.
•	Gunakan transaksi Prisma dan strategi concurrency yang sesuai.
•	Tangani stok tidak mencukupi dengan error yang jelas.
•	Pastikan dua pesanan bersamaan tidak membuat stok negatif.
Tambahkan validasi untuk status dan riwayat perubahan penting jika diperlukan.
11. SUPABASE STORAGE
Implementasikan layanan upload gambar yang terpisah dari business logic.
•	Bucket gambar produk dapat bersifat public untuk gambar katalog yang memang boleh dilihat siapa pun.
•	Simpan URL dan storage path pada database.
•	Admin hanya dapat mengunggah, mengubah, atau menghapus gambar setelah autentikasi.
•	Terapkan batas ukuran, validasi MIME type, dan nama file yang aman.
•	Mendukung foto utama dan pengurutan galeri.
•	Ketika gambar dihapus, tangani penghapusan file dan database dengan cara yang konsisten.
•	Jika operasi lintas storage dan database gagal sebagian, sediakan strategi kompensasi atau pembersihan file yatim.
•	Jangan menaruh service-role key di frontend.
•	Bila kredensial storage belum tersedia, implementasikan service, konfigurasi, dokumentasi setup, dan error handling; jangan membuat upload palsu yang mengaku berhasil.
12. FRONTEND DAN STATE MANAGEMENT
Gunakan feature-based architecture.
Frontend harus mempunyai:
•	Routing pelanggan.
•	Routing admin.
•	Route guard untuk admin.
•	API client terpusat.
•	Query keys yang konsisten.
•	Error handling terpusat.
•	Loading skeleton.
•	Empty states.
•	Toast notification.
•	Form validation.
•	Dialog konfirmasi.
•	Komponen tabel dan pagination reusable.
Simpan keranjang pada localStorage agar bertahan setelah reload. Data keranjang yang disimpan adalah data bantu UI, bukan sumber kebenaran harga dan stok.
Saat checkout, backend harus memvalidasi ulang seluruh item.
Implementasikan halaman minimal:
Public
•	/
•	/products
•	/products/:slug
•	/cart
•	/checkout
•	Halaman 404
Admin
•	/admin/login
•	/admin
•	/admin/categories
•	/admin/products
•	/admin/products/new
•	/admin/products/:id/edit
•	/admin/orders
•	/admin/orders/:id
•	/admin/settings
•	/admin/users bila role dan kebutuhan pengelolaan admin diimplementasikan.
Pengguna yang belum login tidak boleh mengakses halaman admin maupun endpoint admin.
Setelah login berhasil, arahkan admin ke dashboard.
13. ADMIN DASHBOARD
Dashboard minimal menampilkan:
•	Total produk aktif.
•	Total kategori aktif.
•	Jumlah pesanan baru.
•	Jumlah pesanan dalam proses.
•	Jumlah pesanan selesai.
•	Daftar pesanan terbaru.
•	Daftar stok menipis.
•	Shortcut ke CRUD produk dan daftar pesanan.
Angka harus berasal dari API/database, bukan angka statis.
CRUD kategori:
•	Tambah kategori.
•	Edit kategori.
•	Aktifkan/nonaktifkan.
•	Hapus jika aman dan tidak memiliki dependensi yang melarang penghapusan.
CRUD produk:
•	Nama.
•	Slug.
•	SKU.
•	Kategori.
•	Deskripsi.
•	Harga.
•	Stok.
•	Variasi.
•	Galeri gambar.
•	Foto utama.
•	Status publikasi.
•	Pengarsipan produk.
Manajemen pesanan:
•	Daftar dan pagination.
•	Pencarian nomor order/nama pelanggan.
•	Filter status.
•	Detail item dan snapshot harga.
•	Detail pelanggan.
•	Perubahan status yang valid.
•	Status pembayaran.
•	Tombol untuk membuka WhatsApp pelanggan jika nomor tersedia.
•	Konfirmasi sebelum tindakan penting.
Pengaturan toko:
•	Nama toko.
•	Deskripsi toko.
•	Nomor WhatsApp bisnis.
•	Mata uang.
•	Alamat.
•	Pengumuman atau banner bila fitur tersebut dibuat.
14. DATA AWAL DAN SEED
Buat seed yang idempotent.
Seed harus dapat dijalankan berulang tanpa membuat kategori, produk, atau admin duplikat.
Sediakan:
•	Beberapa kategori contoh.
•	Produk contoh dengan gambar placeholder yang valid atau gambar lokal yang disediakan proyek.
•	Contoh produk tanpa variasi.
•	Contoh produk dengan variasi.
•	Pengaturan toko awal.
•	Admin bootstrap dari environment variable.
Gunakan environment variable untuk email dan password bootstrap admin.
Jika variabel admin wajib belum tersedia, jangan menanam kredensial default yang lemah. Berikan pesan error yang jelas atau gunakan mekanisme bootstrap yang aman.
Jangan mengandalkan URL gambar placeholder yang tidak terjamin tersedia. Buat fallback gambar lokal yang benar-benar ada.
15. STRUKTUR FOLDER
Gunakan struktur proyek e-catalog dengan pemisahan direktori frontend dan backend secara jelas. Frontend dan backend memiliki konfigurasi, dependensi, file environment, serta proses development dan build masing-masing.
Gunakan React + TypeScript + Tailwind CSS untuk frontend dan Node.js + NestJS + Express + Prisma ORM untuk backend.
Struktur direktori proyek
e-catalog/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── features/
│   │   │   ├── catalog/
│   │   │   ├── product-detail/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── admin-categories/
│   │   │   ├── admin-products/
│   │   │   ├── admin-orders/
│   │   │   ├── admin-settings/
│   │   │   └── admin-users/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── config/
│   │   ├── prisma/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── product-images/
│   │   ├── product-variants/
│   │   ├── orders/
│   │   ├── checkout/
│   │   ├── uploads/
│   │   ├── settings/
│   │   └── admin-users/
│   ├── test/
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api-documentation.md
│   └── deployment.md
│
├── .gitignore
├── README.md
└── docker-compose.yml
Ketentuan implementasi
1.	Frontend hanya menangani tampilan, navigasi, validasi input untuk kenyamanan pengguna, state keranjang, pemanggilan REST API, dan pembukaan WhatsApp melalui wa.me.
2.	Backend menangani autentikasi admin, otorisasi, validasi bisnis, CRUD, perhitungan harga, pemeriksaan stok, pemrosesan pesanan, upload gambar, dan akses database melalui Prisma ORM.
3.	Database menggunakan PostgreSQL melalui Supabase. Skema Prisma, migration, dan seed ditempatkan di dalam direktori backend/prisma/.
4.	Environment variable dipisahkan sesuai kebutuhan. Frontend menggunakan variabel publik yang aman, seperti URL API. Backend menyimpan kredensial database, secret autentikasi, dan Supabase service-role key. Rahasia backend tidak boleh diekspos ke frontend.
5.	Dokumentasi teknis keseluruhan disimpan di docs/, sedangkan petunjuk instalasi dan penggunaan masing-masing aplikasi disimpan dalam README pada direktori terkait.
6.	Konfigurasi dan dependensi frontend serta backend dikelola secara terpisah. Masing-masing memiliki package.json, konfigurasi TypeScript, dan perintah development/build sendiri. Gunakan root README.md sebagai panduan menjalankan kedua aplikasi.
7.	Pengujian frontend ditempatkan bersama konfigurasi frontend, sedangkan pengujian backend berada di backend/test/ dan dapat dilengkapi dengan pengujian unit di masing-masing modul.
8.	Integrasi API menggunakan REST API dengan prefix /api/v1. Dokumentasi Swagger disediakan oleh backend, misalnya pada endpoint /api/docs.
9.	Jangan menggabungkan kode frontend dan backend ke dalam satu direktori src/. Keduanya harus tetap terpisah agar pengembangan, pengujian, keamanan, dan deployment dapat dikelola secara independen.
10.	Jangan menggunakan struktur monorepo berbasis workspace sebagai kewajiban. Root proyek cukup mengatur dokumentasi dan kebutuhan bersama; frontend dan backend harus dapat diinstal, dijalankan, diuji, dan dibangun secara independen.

16. ENVIRONMENT CONFIGURATION
Buat .env.example yang mencantumkan semua konfigurasi yang dibutuhkan, misalnya:
DATABASE_URL=
DIRECT_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
BACKEND_URL=
PORT=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
ADMIN_BOOTSTRAP_NAME=
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
STORE_DEFAULT_NAME=
STORE_DEFAULT_WHATSAPP=
Sesuaikan variabel dengan implementasi final. Jangan memasukkan nilai rahasia nyata ke .env.example.
Validasi environment variable saat startup dan berikan error yang mudah dipahami jika konfigurasi wajib belum tersedia.
Buat .gitignore yang benar dan pastikan .env tidak masuk ke Git.
Jika tidak ada kredensial Supabase:
•	Tetap implementasikan seluruh source code.
•	Sediakan panduan membuat project Supabase.
•	Sediakan panduan konfigurasi database dan storage.
•	Jangan berpura-pura sudah berhasil terhubung.
•	Jalankan pemeriksaan lokal yang tidak memerlukan koneksi database bila memungkinkan.
17. DOCUMENTATION
Buat dokumentasi:
•	README.md.
•	Architecture overview.
•	Database schema dan ERD dalam Mermaid.
•	Setup lokal.
•	Environment variables.
•	Setup Supabase PostgreSQL.
•	Setup Supabase Storage.
•	Prisma migration.
•	Seed data.
•	Cara membuat akun admin awal.
•	Menjalankan frontend dan backend.
•	Menjalankan test dan build.
•	Endpoint Swagger.
•	Panduan checkout WhatsApp.
•	Panduan deployment.
•	Batasan yang masih membutuhkan kredensial atau konfigurasi eksternal.
Buat Swagger/OpenAPI yang lengkap, bukan hanya halaman Swagger tanpa dokumentasi endpoint.
18. QUALITY ASSURANCE DAN ACCEPTANCE CRITERIA
Buat pengujian yang relevan.
Database dan backend
•	Prisma schema lolos validasi.
•	Migration dapat diterapkan pada database yang tersedia.
•	Seed tidak membuat duplikat.
•	Login berhasil dengan kredensial valid.
•	Login gagal dengan kredensial tidak valid.
•	Endpoint admin ditolak tanpa autentikasi.
•	CRUD kategori bekerja.
•	CRUD produk bekerja.
•	Upload dan pengelolaan gambar memiliki validasi.
•	Pencarian, filter, sorting, dan pagination bekerja.
•	Produk dan variasi yang tidak aktif tidak dapat dipesan.
•	Harga dan total dihitung backend.
•	Checkout menyimpan order dan item secara konsisten.
•	Nomor order unik.
•	Stok tidak negatif.
•	Perubahan status pesanan mengikuti transisi yang valid.
•	Pembatalan tidak menyebabkan pengembalian stok ganda.
•	Error response tidak membocorkan rahasia.
Frontend
•	Halaman katalog dapat mengambil data dari API.
•	Search dan filter bekerja.
•	Detail produk mengambil data sesuai slug.
•	Variasi dan kuantitas tervalidasi.
•	Keranjang bertahan setelah reload.
•	Checkout menampilkan validasi.
•	Checkout membuat order melalui API.
•	WhatsApp dibuka dengan pesan ter-encode.
•	Admin dapat login dan logout.
•	Route admin terlindungi.
•	CRUD menggunakan API sungguhan.
•	Perubahan status pesanan terlihat setelah data diperbarui.
•	Loading, empty, success, dan error states tersedia.
•	Layout berfungsi pada desktop dan mobile.
•	Tidak ada tombol utama yang hanya menjadi dekorasi.
Pemeriksaan teknis
Jalankan perintah yang tersedia pada proyek untuk:
•	Prisma validate.
•	TypeScript typecheck.
•	Lint.
•	Unit tests.
•	Integration/API tests.
•	Frontend tests.
•	Production build.
Periksa hasil setiap perintah. Perbaiki error yang disebabkan implementasi sampai seluruh pemeriksaan yang dapat dijalankan berhasil.
Jika pengujian memerlukan database atau kredensial yang belum tersedia, tandai pengujian tersebut sebagai blocked dengan alasan yang jelas. Jangan mengklaim lulus apabila belum dijalankan.
19. URUTAN EKSEKUSI
Kerjakan dengan urutan berikut:
1.	Periksa direktori kerja dan file yang sudah ada.
2.	Pertahankan pekerjaan yang valid jika repositori bukan folder kosong.
3.	Buat struktur monorepo dan konfigurasi package.
4.	Implementasikan Prisma schema lengkap.
5.	Implementasikan konfigurasi environment.
6.	Buat migration dan seed.
7.	Implementasikan autentikasi admin dan keamanan.
8.	Implementasikan seluruh REST API.
9.	Implementasikan storage gambar.
10.	Implementasikan katalog pelanggan.
11.	Implementasikan detail produk dan variasi.
12.	Implementasikan keranjang.
13.	Implementasikan checkout dan WhatsApp.
14.	Implementasikan admin control panel.
15.	Implementasikan CRUD dan manajemen pesanan.
16.	Integrasikan frontend dan backend.
17.	Buat Swagger dan dokumentasi.
18.	Tambahkan pengujian.
19.	Jalankan lint, typecheck, tests, Prisma validation, migration yang memungkinkan, dan build.
20.	Perbaiki error dan regresi.
21.	Perbarui README sesuai kondisi implementasi sebenarnya.
22.	Berikan laporan akhir.
Boleh mengerjakan tugas-tugas independen secara paralel jika tooling mendukung, tetapi pastikan integrasi final tetap diverifikasi.
Jangan menghapus atau menimpa file yang sudah berisi pekerjaan pengguna tanpa memeriksanya terlebih dahulu.
Jangan berhenti hanya karena satu integrasi eksternal belum memiliki kredensial. Implementasikan bagian lain dan catat blocker secara akurat.
Jangan menjalankan perintah destruktif pada database yang sudah berisi data tanpa izin eksplisit.
20. DEFINISI SELESAI
Proyek dianggap selesai jika:
•	Struktur proyek benar.
•	Semua modul utama telah diimplementasikan.
•	Prisma schema lengkap dan valid.
•	REST API terdokumentasi.
•	Frontend terhubung ke backend.
•	Katalog, detail, variasi, keranjang, checkout, dan WhatsApp berfungsi.
•	Admin dapat login.
•	CRUD master data berfungsi.
•	Manajemen pesanan berfungsi.
•	Validasi harga, stok, dan status diterapkan di backend.
•	Pengujian yang dapat dijalankan sudah dieksekusi dan hasilnya dilaporkan.
•	README dan .env.example tersedia.
•	Tidak ada rahasia yang di-hardcode.
•	Tidak ada klaim palsu tentang deployment, integrasi, atau tes yang belum dilakukan.
21. LAPORAN AKHIR
Setelah implementasi, berikan laporan singkat yang berisi:
1.	Fitur yang sudah selesai.
2.	Struktur file utama yang dibuat.
3.	Database model dan migration yang tersedia.
4.	Endpoint penting dan lokasi Swagger.
5.	Perintah untuk instalasi, development, migration, seed, testing, dan build.
6.	Environment variable yang wajib diisi.
7.	Hasil lint, typecheck, test, Prisma validation, dan build, lengkap dengan status aktual.
8.	Status integrasi Supabase dan WhatsApp.
9.	Langkah manual yang masih dibutuhkan.
10.	Error atau keterbatasan yang belum terselesaikan.
Bedakan dengan jelas antara:
•	Implemented.
•	Tested and passed.
•	Blocked by missing credentials or infrastructure.
•	Not implemented.
MULAI SEKARANG. Periksa direktori kerja, kemudian implementasikan aplikasi secara menyeluruh. Jangan hanya membalas dengan rencana atau kode contoh.

