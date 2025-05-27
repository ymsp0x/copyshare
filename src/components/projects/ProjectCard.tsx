import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Project } from '../../types/database.types';
import { cn, STATUS_COLORS } from '../../lib/utils';
import Button from '../ui/Button';
import DOMPurify from 'dompurify';

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
  onShare?: (project: Project) => void;
}

const stripHtmlTags = (htmlString: string | null): string => {
  if (!htmlString) return '';
  const cleanHtml = DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
  const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
  return doc.documentElement.textContent || '';
};

export default function ProjectCard({ project, showActions = true, onShare }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] || 'bg-neutral-100 text-neutral-800';
  const defaultImage = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

  const plainTextDescription = stripHtmlTags(project.description);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full group shadow-glow-sm dark:shadow-glow-sm hover:shadow-glow-md dark:hover:shadow-glow-md">
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.image_url || defaultImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy" // <-- Added lazy loading here
        />
        <div className="absolute top-3 right-3">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", statusColor)}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">{project.title}</h3>

        <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4 line-clamp-3">{plainTextDescription}</p>

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