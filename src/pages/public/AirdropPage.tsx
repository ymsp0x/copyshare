// project/src/pages/public/AirdropPage.tsx
// Halaman ini menampilkan daftar aktivitas terkait Airdrop,
// diambil dari tabel 'activities' di Supabase.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import { Activity } from '../../types/database.types';
import { TextLogo } from '../../components/ui/Logo';
import { cn } from '../../lib/utils';

export default function AirdropPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    async function fetchAirdropActivities() {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('activities')
          .select('*, projects!inner(categories)') // <-- JOIN ke projects untuk mengambil kategori
          .order('created_at', { ascending: false })
          .limit(50);

        if (selectedStatus !== 'All') {
          query = query.eq('project_status_after', selectedStatus);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }
        setActivities(data || []);
      } catch (err: any) {
        console.error('Error fetching airdrop activities:', err.message);
        setError('Failed to load airdrop activities: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAirdropActivities();
  }, [selectedStatus]);

  const formatActivityType = (type: string): string => {
    switch (type) {
      case 'airdrop_created_aktif':
        return 'New Airdrop (Active)';
      case 'airdrop_created_segera':
        return 'New Airdrop (Upcoming)';
      case 'airdrop_created_selesai':
        return 'New Airdrop (Completed)';
      case 'airdrop_updated_aktif':
        return 'Airdrop Update (Active)';
      case 'airdrop_updated_segera':
        return 'Airdrop Update (Upcoming)';
      case 'airdrop_updated_selesai':
        return 'Airdrop Update (Completed)';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }
  };

  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  return (
    <div className="min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light flex flex-col">
      <Navbar showSearchAndCategories={false} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-6">
          Airdrop Terbaru
        </h1>

        {/* Dropdown Filter Status */}
        <div className="mb-8 max-w-xs sm:max-w-none">
          <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm p-2.5
                       bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          >
            <option value="All">All Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Segera">Segera</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        {/* Conditional Rendering berdasarkan status loading dan error */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400 py-10">
            <p>{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-10">
            <p>Tidak ada airdrop saat ini.</p>
            <p>Airdrop baru tersedia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 sm:p-7 border border-neutral-200 dark:border-neutral-700 transition-all duration-200 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600">
                {/* Menggunakan flexbox untuk menata gambar dan teks */}
                <div className="flex items-start sm:items-center gap-4 mb-3">
                  {/* Gambar Profil Proyek Airdrop (Kecil, Lingkaran di Kiri) */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-700">
                    <img
                      src={activity.image_url || defaultImage}
                      alt={activity.entity_name || 'Airdrop Image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Konten Teks Kartu */}
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {activity.entity_name}
                      {activity.entity_type === 'project' && activity.metadata?.slug && (
                        <Link to={`/project/${activity.metadata.slug}`} className="ml-2 text-primary-500 hover:underline hover:text-primary-600 dark:hover:text-primary-300 transition-colors duration-200 text-base font-normal">
                          (View)
                        </Link>
                      )}
                    </h2>
                    {/* Menampilkan status saat ini */}
                    {activity.project_status_after && (
                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
                            Status: {activity.project_status_after}
                        </span>
                    )}
                  </div>
                </div>
                
                {/* Deskripsi Aktivitas */}
                {activity.description && (
                    <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed mt-2">
                        {activity.description}
                    </p>
                )}

                {/* Kategori Proyek */}
                {activity.projects?.categories && activity.projects.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                        {activity.projects.categories.map((category, index) => (
                            <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded text-xs">
                                {category}
                            </span>
                        ))}
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <TextLogo />
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Temukan dan bagikan proyek menakjubkan.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} CopyShare. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}