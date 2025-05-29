// project/src/pages/public/LandingPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/layout/Navbar';
import { TextLogo } from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { cn, STATUS_COLORS } from '../../lib/utils';
import Skeleton from 'react-loading-skeleton';
import DOMPurify from 'dompurify';

export default function LandingPage() {
  const [highlightProjects, setHighlightProjects] = useState<Project[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlightProjects = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .not('project_type', 'in', '("airdrop", "both")') // Filter berdasarkan project_type
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setHighlightProjects(data || []);
      } catch (error) {
        console.error('Error fetching highlight projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlightProjects();
  }, []);

  useEffect(() => {
    if (highlightProjects.length > 1) {
      const interval = setInterval(() => {
        setCurrentProjectIndex(
          (prevIndex) => (prevIndex + 1) % highlightProjects.length
        );
      }, 5000); // Ganti proyek setiap 5 detik
      return () => clearInterval(interval);
    }
  }, [highlightProjects]);

  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  // Helper untuk menghapus tag HTML dari deskripsi
  const stripHtmlTags = (htmlString: string | null): string => {
    if (!htmlString) return '';
    const cleanHtml = DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
    const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
    return doc.documentElement.textContent || '';
  };


  return (
    <div className="min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light flex flex-col">
      <Navbar showSearchAndCategories={false} />

      <main className="flex-1 flex flex-col">
        {/* Original Hero Section */}
        <section className="bg-background-light dark:bg-background-dark py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-pink mb-4 [text-shadow:_0_2px_8px_rgb(0_0_0_/_20%)] animate-fade-in-up delay-400">
                Temukan dan Bagikan Proyek Menakjubkan
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-600">
                CopyShare adalah gerbang Anda menuju proyek-proyek terbaru dan terbaik. Jelajahi, saring, dan bagikan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-800">
                <Link
                  to="/projects"
                  className="px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Jelajahi Proyek
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: Highlight Projects Section (below hero, 1 of 3 sliding, card-like appearance) */}
        <section className="py-12 bg-background-light dark:bg-background-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-text-dark dark:text-text-light mb-8 text-center">
              Sorotan Proyek Unggulan
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800" style={{ minHeight: '500px' }}>
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col sm:flex-row items-center justify-center p-8">
                    <Skeleton className="w-full sm:w-1/2 h-64 sm:h-auto rounded-lg" />
                    <div className="w-full sm:w-1/2 sm:pl-10 mt-6 sm:mt-0">
                        <Skeleton height={40} width="80%" className="mb-4" />
                        <Skeleton count={3} className="mb-2" />
                        <Skeleton height={20} width="60%" className="mb-6" />
                        <Skeleton height={48} width="150px" />
                    </div>
                </div>
              ) : highlightProjects.length > 0 ? (
                    highlightProjects.map((project, index) => {
                      const statusColor = STATUS_COLORS[project.status] || 'bg-neutral-100 text-neutral-800';
                      
                      
                      const displayedDescription = stripHtmlTags(project.description);

                      return (
                        <div
                          key={project.id}
                          className={cn(
                            "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex flex-col md:flex-row",
                            index === currentProjectIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                          )}
                        >
                          {/* Image Section */}
                          <div className="relative w-full md:w-1/2 h-64 md:h-full overflow-hidden">
                            <img
                              src={project.image_url || defaultImage}
                              alt={project.title}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between text-neutral-900 dark:text-neutral-100">
                            <div>
                              <h3 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">
                                {project.title}
                              </h3>
                              <p className="text-neutral-600 dark:text-neutral-300 text-base mb-6 line-clamp-4">
                                {displayedDescription}
                              </p>

                              <div className="flex flex-wrap gap-1.5 mb-6">
                                {project.categories?.slice(0, 3).map((category, catIndex) => (
                                  <span key={catIndex} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded text-xs">
                                    {category}
                                  </span>
                                ))}
                                {project.categories && project.categories.length > 3 && (
                                  <span className="bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 px-2 py-0.5 rounded text-xs">
                                    +{project.categories.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <Link to={`/project/${project.slug}`}>
                                <Button size="md">Lihat Detail</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <h2 className="text-2xl font-semibold mb-4">Tidak ada proyek yang ditemukan</h2>
                      <p>Periksa kembali nanti untuk proyek-proyek baru yang menarik!</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
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
                  © {new Date().getFullYear()} CopyShare. Semua hak dilindungi.
                </div>
              </div>
            </div>
          </footer>
        </div>
      );
    }