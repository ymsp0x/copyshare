// project/src/components/projects/ProjectGrid.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Project } from '../../types/database.types';
import ProjectCard from './ProjectCard';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import ShareModal from './ShareModal';
import { supabase } from '../../lib/supabase';

interface ProjectGridProps {
  searchQuery?: string;
  selectedCategory?: string | null;
}

export default function ProjectGrid({ searchQuery = '', selectedCategory }: ProjectGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      console.log('ProjectGrid: Fetching projects with searchQuery:', searchQuery, 'selectedCategory:', selectedCategory);

      try {
        let query = supabase
          .from('projects')
          .select('*')
          .not('categories', 'cs', '["Airdrop"]')
          .order('created_at', { ascending: false });

        const trimmedSearchQuery = searchQuery.trim();

        if (trimmedSearchQuery && selectedCategory) {
          query = query
            .filter('categories', 'cs', `["${selectedCategory}"]`)
            .or(
              `title.ilike.%<span class="math-inline">\{trimmedSearchQuery\}%,slug\.ilike\.%</span>{trimmedSearchQuery}%`
            );
        } else if (selectedCategory) {
          query = query.filter('categories', 'cs', `["${selectedCategory}"]`);
        } else if (trimmedSearchQuery) {
          query = query.or(
            `title.ilike.%<span class="math-inline">\{trimmedSearchQuery\}%,slug\.ilike\.%</span>{trimmedSearchQuery}%,categories.cs.["${trimmedSearchQuery}"]`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error('ProjectGrid: Supabase fetch error:', error);
          throw error;
        }

        console.log('ProjectGrid: Raw data from Supabase:', data);
        setProjects(data || []);

      } catch (error) {
        console.error('ProjectGrid: Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [searchQuery, selectedCategory]);

  const handleShare = (project: Project) => {
    setSelectedProject(project);
    setShowShareModal(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium text-neutral-700 dark:text-neutral-200 mb-2">No projects found</h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          {searchQuery || selectedCategory
            ? 'Try adjusting your search or filters'
            : 'Projects will appear here once they are added'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onShare={handleShare}
          />
        ))}
      </div>

      {selectedProject && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={selectedProject}
        />
      )}
    </>
  );
}