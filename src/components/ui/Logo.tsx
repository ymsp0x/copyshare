// project/src/components/ui/Logo.tsx
// Hapus import { Copy } dari 'lucide-react' jika tidak lagi digunakan.
// Hapus juga import path lokal seperti import myLogoImage from '/mylogo.png';

// Import logo lokal dari path yang benar
import localLogoImage from '/logo.png'; // <--- BARIS INI DITAMBAHKAN/DIMODIFIKASI

export function GradientLogo({ className = 'h-10 w-10' }) {
  // GANTI DENGAN URL LANGSUNG GAMBAR LOGO ANDA DARI IMGUR atau CDN lainnya
  // Pastikan ini adalah URL gambar langsung (berakhir dengan .png, .jpg, .svg, dll.), bukan halaman Imgur.
  const imageUrl = localLogoImage; // <--- BARIS INI DIMODIFIKASI untuk menggunakan import lokal

  return (
    <div className={`relative ${className}`}>
      {/* HAPUS elemen gradien yang berputar */}
      {/*
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-purple-500 to-secondary-500 rounded-lg transform rotate-6"></div>
      */}
      
      {/* Ini adalah penampung di mana gambar logo Anda akan ditempatkan */}
      {/* Pastikan latar belakang penampung gambar transparan */}
      <div className="absolute inset-0 bg-transparent rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt="CopyShare Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

export function TextLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Kita tetap menggunakan GradientLogo di sini untuk kesederhanaan,
          tapi karena definisi GradientLogo sudah tanpa gradien,
          ini hanya akan menampilkan gambar logo biasa. */}
      <GradientLogo className="h-8 w-8" />
      <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
        CopyShare
      </span>
    </div>
  );
}