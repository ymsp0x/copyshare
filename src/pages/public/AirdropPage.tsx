// project/src/pages/public/AirdropPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import CategoryTags from '../../components/public/CategoryTags';
import ProjectCard from '../../components/public/ProjectCard';

function AirdropPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchRelatedProjects(id);
    }
  }, [id]);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, projects!inner(categories)')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load airdrop details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedProjects = async (currentProjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, projects!inner(categories)')
        .neq('id', currentProjectId)
        .eq('project_type', 'airdrop')
        .limit(3);

      if (error) {
        throw error;
      }
      setRelatedProjects(data || []);
    } catch (error) {
      console.error('Error fetching related projects:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!project) {
    return <div className="flex justify-center items-center h-screen">Airdrop not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">{project.title}</h1>
        <CategoryTags categories={project.projects?.categories || []} />

        {/* Render deskripsi airdrop dengan dangerouslySetInnerHTML */}
        <div 
          className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: project.airdrop_description || '' }}
        />

        {project.project_url && (
          <a
            href={project.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Visit Project <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        )}
      </div>

      {relatedProjects.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-6">Related Airdrops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProjects.map((relatedProject) => (
              <ProjectCard key={relatedProject.id} project={relatedProject} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AirdropPage;