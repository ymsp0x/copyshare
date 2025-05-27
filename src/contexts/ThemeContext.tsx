import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Mendefinisikan tipe untuk konteks tema
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Membuat konteks tema dengan nilai default undefined
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Komponen penyedia tema
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Menginisialisasi tema dari localStorage atau default ke 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
    }
    return 'light'; // Default ke 'light' jika tidak di lingkungan browser
  });

  // Fungsi untuk mengubah tema
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Efek samping untuk menerapkan kelas 'dark' ke elemen <html> dan menyimpan ke localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark'); // Hapus kelas tema yang ada
      root.classList.add(theme); // Tambahkan kelas tema saat ini
      localStorage.setItem('theme', theme); // Simpan tema ke localStorage
    }
  }, [theme]); // Jalankan efek setiap kali tema berubah

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook kustom untuk menggunakan konteks tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};