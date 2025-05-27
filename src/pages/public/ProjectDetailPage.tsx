// copyshare/project-bolt-sb1-u6g5e6ai.zip/project/src/pages/public/ProjectDetailPage.tsx
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

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  
  useEffect(() => {
    const fetchProjectAndRelated = async () => {
      setIsLoading(true);
      try {
        // Fetch main project
        const { data: mainProject, error: mainError } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (mainError) {
          throw mainError;
        }
        setProject(mainProject);

        // Fetch related/other projects
        let relatedQuery = supabase
          .from('projects')
          .select('*')
          .neq('slug', slug) // Exclude current project
          .order('created_at', { ascending: false }) // Order by latest
          .limit(4); // Get 4 other projects

        // Optional: Fetch by related categories if the main project has them
        if (mainProject?.categories && mainProject.categories.length > 0) {
            // This is a more complex filter for related. For simplicity, just get others for now.
            // A more advanced query might look for projects sharing at least one category.
            // For this example, we'll stick to 'latest other projects'.
        }

        const { data: otherProjects, error: otherError } = await relatedQuery;

        if (otherError) {
          console.error("Error fetching other projects:", otherError);
          // Don't throw fatal error if related projects fail, just log
        }
        setRelatedProjects(otherProjects || []);

      } catch (error) {
        console.error('Error fetching project details or related projects:', error);
        toast.error('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectAndRelated();
  }, [slug]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center text-gray-900 dark:text-gray-100">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">The project you are looking for does not exist or has been removed.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const statusColor = STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800';
  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
          {/* Tombol Share DIPINDAHKAN ke dalam kolom detail proyek */}
        </div>
        
        {/* Layout dua kolom untuk desktop, satu kolom untuk mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kolom Kiri: Detail Proyek Utama */}
          <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden p-6 md:p-8 flex flex-col items-center">
            {/* Header di dalam kolom utama, termasuk tombol share */}
            <div className="w-full flex justify-end mb-4 z-20">
              <Button 
                variant="outline"
                onClick={() => setShowShareModal(true)}
                className="p-2 sm:px-4 sm:py-2" // MODIFIED: Menyesuaikan padding untuk ikon di mobile
              >
                <Share2 className="h-4 w-4 sm:mr-2" /> {/* MODIFIED: Menyesuaikan margin untuk ikon */}
                <span className="hidden sm:inline">Share</span> {/* MODIFIED: Menyembunyikan teks di mobile, menampilkannya di sm ke atas */}
              </Button>
            </div>

            {/* Bagian gambar proyek, diubah menjadi lebih kecil dan fokus */}
            <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 mb-6 relative overflow-hidden rounded-lg shadow-md">
              <img 
                src={project.image_url || defaultImage}
                alt={project.title}
                className="w-full h-full object-cover object-center" 
              />
            </div>
            
            <div className="text-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mr-3">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {project.categories?.map((category, index) => (
                  <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-3 py-1 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
              
              <div className="prose max-w-none mb-6 text-gray-700 dark:text-gray-300 text-left">
                <p className="whitespace-pre-line">{project.description}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-gray-200 dark:border-neutral-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
                  Published on {formatDate(project.created_at)}
                </div>
                
                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Visit Project
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Proyek Lainnya */}
          {relatedProjects.length > 0 && (
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold text-text-dark dark:text-text-light mb-4">More Projects</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Gunakan ProjectCard, tanpa actions */}
                {relatedProjects.map((rp) => (
                  <ProjectCard key={rp.id} project={rp} showActions={false} />
                ))}
              </div>
            </div>
          )}
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