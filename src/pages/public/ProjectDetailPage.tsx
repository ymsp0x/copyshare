// project/src/pages/public/ProjectDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import ShareModal from '../../components/projects/ShareModal';
import ProjectCard from '../../components/projects/ProjectCard';
import { formatDate, STATUS_COLORS } from '../../lib/utils';
import DOMPurify from 'dompurify';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedAirdrops, setRelatedAirdrops] = useState<Project[]>([]);
  const [relatedRegularProjects, setRelatedRegularProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAirdropStatusFilter, setSelectedAirdropStatusFilter] = useState<string>('All');

  useEffect(() => {
    const fetchProjectAndRelated = async () => {
      setIsLoading(true);
      try {
        const { data: mainProject, error: mainError } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .single();

        if (mainError) {
          throw mainError;
        }
        setProject(mainProject);

        let airdropQuery = supabase
          .from('projects')
          .select('*')
          .neq('slug', slug)
          .in('project_type', ['airdrop', 'both'])
          .order('created_at', { ascending: false })
          .limit(3);

        if (selectedAirdropStatusFilter !== 'All') {
          airdropQuery = airdropQuery.eq('status', selectedAirdropStatusFilter);
        }

        const { data: airdrops, error: airdropError } = await airdropQuery;

        if (airdropError) {
          console.error("Error fetching related airdrops:", airdropError);
        }
        setRelatedAirdrops(airdrops || []);

        const { data: regularProjects, error: regularError } = await supabase
          .from('projects')
          .select('*')
          .neq('slug', slug)
          .not('project_type', 'in', ['airdrop', 'both'])
          .order('created_at', { ascending: false })
          .limit(3);

        if (regularError) {
          console.error("Error fetching related regular projects:", regularError);
        }
        setRelatedRegularProjects(regularProjects || []);


      } catch (error) {
        console.error('Error fetching project details or related projects:', error);
        toast.error('Gagal memuat detail proyek');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndRelated();
  }, [slug, selectedAirdropStatusFilter]);

  const renderHtmlContent = (htmlContent: string | null) => {
    if (!htmlContent) return { __html: '' };
    const cleanHtml = DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } });
    return { __html: cleanHtml };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar showSearchAndCategories={false} />
        <div className="container mx-auto px-4 py-12 text-center text-neutral-900 dark:text-neutral-100">
          <h1 className="text-2xl font-bold mb-4">Proyek Tidak Ditemukan</h1>
          <p className="text-neutral-600 dark:text-neutral-300 mb-8">Proyek yang Anda cari tidak ada atau telah dihapus.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAirdropProject = project.project_type === 'airdrop' || project.project_type === 'both';
  const statusColor = STATUS_COLORS[project.status] || 'bg-neutral-100 text-neutral-800';
  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  // Tentukan deskripsi yang akan ditampilkan
  const contentToDisplay = isAirdropProject ? project.airdrop_description : project.description;


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar showSearchAndCategories={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/projects" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Proyek
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 md:p-8 flex flex-col items-center" style={{ overflow: 'visible' }}>
            <div className="w-full flex justify-between items-center mb-4 z-20">
              {isAirdropProject && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                  {project.status}
                </span>
              )}

              <Button
                variant="outline"
                onClick={() => setShowShareModal(true)}
                className="p-2 sm:px-4 sm:py-2"
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bagikan</span>
              </Button>
            </div>

            <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 mb-6 relative overflow-hidden rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
              <img
                src={project.image_url || defaultImage}
                alt={project.title}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="text-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{project.title}</h1>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {project.categories?.map((category, index) => (
                  <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>

              {/* LOGIKA PERBAIKAN DI SINI UNTUK MENAMPILKAN DESKRIPSI YANG TEPAT */}
              <div
                className="ql-editor description-content max-w-none mb-6 text-left"
                dangerouslySetInnerHTML={renderHtmlContent(contentToDisplay)}
              />
            </div>

            <div className="flex flex-row items-center justify-start sm:justify-end gap-x-4 pt-6 border-t border-neutral-200 dark:border-neutral-700 w-full">
              <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-0">
                Dipublikasikan pada {formatDate(project.created_at)}
              </div>

              {project.project_url && (
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto flex-1 justify-center"
                >
                  Kunjungi Proyek
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              )}
            </div>

          </div>

          <div className="md:col-span-1 space-y-8">
            {relatedAirdrops.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Proyek Airdrop Lainnya</h2>
                <div className="mb-4">
                  <label htmlFor="airdrop-status-filter" className="sr-only">Filter Airdrop by Status</label>
                  <select
                    id="airdrop-status-filter"
                    value={selectedAirdropStatusFilter}
                    onChange={(e) => setSelectedAirdropStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm p-2.5
                               bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                               focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Segera">Segera</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {relatedAirdrops.map((rp) => (
                    <Link key={rp.id} to={`/project/${rp.slug}`} className="block">
                      {/* Menggunakan ProjectCard dengan variant "list" di sini juga */}
                      <ProjectCard project={rp} showActions={false} variant="list" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedRegularProjects.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Proyek Lainnya</h2>
                <div className="grid grid-cols-1 gap-4">
                  {relatedRegularProjects.map((rp) => (
                    <Link key={rp.id} to={`/project/${rp.slug}`} className="block">
                      {/* Menggunakan ProjectCard dengan variant "list" di sini juga */}
                      <ProjectCard project={rp} showActions={false} variant="list" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relatedAirdrops.length === 0 && relatedRegularProjects.length === 0 && (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                <p>Tidak ada proyek terkait lainnya.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showShareModal && project && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={project}
        />
      )}
    </div>
  );
}