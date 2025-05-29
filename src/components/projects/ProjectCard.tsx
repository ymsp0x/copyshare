// project/src/components/projects/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Project } from '../../types/database.types';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import DOMPurify from 'dompurify';

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
  onShare?: (project: Project) => void;
  variant?: 'default' | 'list';
}

const stripHtmlTags = (htmlString: string | null): string => {
  if (!htmlString) return '';
  const cleanHtml = DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
  const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
  return doc.documentElement.textContent || '';
};

export default function ProjectCard({ project, showActions = true, onShare, variant = 'default' }: ProjectCardProps) {
  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  const displayedDescription = stripHtmlTags(project.description); 

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg group",
      "shadow-glow-sm dark:shadow-glow-sm hover:shadow-glow-md dark:hover:shadow-glow-md",
      variant === 'default' ? "flex flex-col h-full" : "flex flex-row items-center p-4 h-auto"
    )}>
      <div className={cn(
        "relative overflow-hidden",
        variant === 'default' ? "h-48 rounded-xl" : "w-24 h-24 rounded-full flex-shrink-0 mr-4"
      )}>
        <img
          src={project.image_url || defaultImage}
          alt={project.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            variant === 'default' ? "group-hover:scale-105" : ""
          )}
          loading="lazy"
        />
      </div>

      <div className={cn(
        "flex-1 flex flex-col",
        variant === 'default' ? "p-5" : "py-1"
      )}>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">{project.title}</h3>

        {variant === 'default' && (
          <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4 line-clamp-3">
            {displayedDescription}
          </p>
        )}
        {variant === 'list' && project.airdrop_description && (
            <p className="text-neutral-600 dark:text-neutral-300 text-xs mb-2 line-clamp-2">
              {stripHtmlTags(project.airdrop_description)}
            </p>
        )}


        <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
          {project.categories?.slice(0, 3).map((category, index) => (
            <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded text-xs">
              {category}
            </span>
          ))}
          {project.categories && project.categories.length > 3 && (
            <span className="bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 px-2 py-0.5 rounded text-xs">
              +{project.categories.length - 3}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center justify-between mt-auto">
            <Link to={`/project/${project.slug}`}>
              <Button size="sm" variant="outline">
                View details
              </Button>
            </Link>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShare && onShare(project)}
              aria-label="Share project"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}