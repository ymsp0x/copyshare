// project/src/components/public/CategoryTags.tsx
// Komponen untuk menampilkan daftar kategori sebagai tag yang rapi.

import React from 'react';
import { cn } from '../../lib/utils'; // Import utility cn untuk Tailwind CSS

interface CategoryTagsProps {
  categories: string[]; // Array string kategori
  maxVisible?: number; // Opsional: jumlah maksimum tag yang terlihat sebelum menambahkan "+X"
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ categories, maxVisible = 3 }) => {
  // Jika tidak ada kategori atau array kosong, jangan render apa pun
  if (!categories || categories.length === 0) {
    return null;
  }

  // Ambil kategori yang akan terlihat dan hitung sisanya
  const visibleCategories = categories.slice(0, maxVisible);
  const remainingCount = categories.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Render tag kategori yang terlihat */}
      {visibleCategories.map((category, index) => (
        <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded text-xs">
          {category}
        </span>
      ))}
      {/* Render badge "+X" jika ada kategori yang tersisa */}
      {remainingCount > 0 && (
        <span className="bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 px-2 py-0.5 rounded text-xs">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default CategoryTags;