import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const STATUS_COLORS = {
  'Aktif': 'bg-green-100 text-green-800',
  'Segera': 'bg-yellow-100 text-yellow-800',
  'Selesai': 'bg-gray-100 text-gray-800',
};

export const CATEGORIES = [
  'AI & Data',
  'Airdrop',
  'Alpha Project',
  'DeFi',
  'Early-Access',
  'Gaming & Metaverse',
  'Identity',
  'Infra',
  'Privacy & Security',
  'Social',
  'Tooling',
  'Wallet'
];

export async function uploadImage(file: File, bucket = 'project-images') {
  const timestamp = new Date().getTime();
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    throw new Error('Error uploading image: ' + error.message);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}