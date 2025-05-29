// project/src/pages/public/AirdropPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import ProjectCard from '../../components/projects/ProjectCard';
import Navbar from '../../components/layout/Navbar';
import ShareModal from '../../components/projects/ShareModal';

function AirdropPage() {
  const [airdropProjects, setAirdropProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAirdropStatusFilter, setSelectedAirdropStatusFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchAllAirdropProjects();
  }, [selectedAirdropStatusFilter]);

  const fetchAllAirdropProjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .in('project_type', ['airdrop', 'both'])
        .order('created_at', { ascending: false });

      if (selectedAirdropStatusFilter !== 'All') {
        query = query.eq('status', selectedAirdropStatusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetchAllAirdropProjects error:', error);
        throw error;
      }
      console.log('fetchAllAirdropProjects: Data received:', data);
      setAirdropProjects(data || []);
    } catch (error) {
      console.error('Error fetching airdrop projects:', error);
      toast.error('Gagal memuat daftar airdrop.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (project: Project) => {
    setSelectedProject(project);
    setShowShareModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-dark dark:text-text-light flex flex-col">
      <Navbar showSearchAndCategories={false} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-4">Daftar Airdrop</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Jelajahi berbagai proyek airdrop yang tersedia.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="airdrop-status-filter" className="sr-only">Filter Airdrop by Status</label>
          <select
            id="airdrop-status-filter"
            value={selectedAirdropStatusFilter}
            onChange={(e) => setSelectedAirdropStatusFilter(e.target.value)}
            className="w-full md:w-auto rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm p-2.5
                       bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                       focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <option value="All">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Segera">Segera</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        {airdropProjects.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-neutral-700 dark:text-neutral-200 mb-2">Tidak ada proyek Airdrop ditemukan.</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              Coba sesuaikan filter atau periksa kembali nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {airdropProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showActions={true}
                variant="list"
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Temukan dan bagikan proyek menakjubkan.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} CopyShare. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>

      {selectedProject && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={selectedProject}
        />
      )}
    </div>
  );
}

export default AirdropPage;