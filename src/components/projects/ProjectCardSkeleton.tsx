import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Import the CSS for skeleton

const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <Skeleton height={192} className="w-full" /> {/* Height matches h-48 */}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          <Skeleton width="80%" />
        </h3>

        <p className="text-sm mb-4 line-clamp-3">
          <Skeleton count={3} />
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
          <Skeleton width={60} height={20} className="rounded-full" />
          <Skeleton width={60} height={20} className="rounded-full" />
          <Skeleton width={40} height={20} className="rounded-full" />
        </div>

        <div className="flex items-center justify-between mt-auto">
          <Skeleton width={100} height={32} />
          <Skeleton circle width={32} height={32} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCardSkeleton;