// src/pages/public/PublicProjectDashboard.tsx
import { useState, useDeferredValue } from 'react';
import ProjectGrid from '../../components/projects/ProjectGrid';
import Navbar from '../../components/layout/Navbar'; // Import the central Navbar
import { TextLogo } from '../../components/ui/Logo'; // Import TextLogo for footer

export default function PublicProjectDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light flex flex-col">
      {/* Use the central Navbar component, passing props for search and categories */}
      <Navbar
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        showSearchAndCategories={true} // Enable search and categories for the dashboard
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-4">All Projects</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Browse through our complete collection of projects. Use the search bar and category filters to find what you need.
          </p>
        </div>
        <ProjectGrid
          searchQuery={deferredSearchQuery}
          selectedCategory={selectedCategory}
        />
      </main>

      <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <TextLogo />
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Discover and share amazing projects.
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