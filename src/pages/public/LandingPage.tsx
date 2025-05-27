// project/src/pages/public/LandingPage.tsx
import { useState, useDeferredValue, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Tag, Sun, Moon } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { GradientLogo, TextLogo } from '../../components/ui/Logo';
import ProjectGrid from '../../components/projects/ProjectGrid';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light">
      <Navbar
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      <main>
        <section className="bg-background-light dark:bg-background-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Logo GradientLogo dihapus dari sini */}
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-pink mb-4 [text-shadow:_0_2px_8px_rgb(0_0_0_/_20%)] animate-fade-in-up delay-400">
                Discover and Share Amazing Projects
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-600"> {/* MODIFIED */}
                CopyShare is your gateway to the latest and greatest projects. Browse, filter, and share with just a few clicks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-800">
                <a
                  href="#projects"
                  className="px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Explore Projects
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="py-12 bg-background-light dark:bg-background-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-text-dark dark:text-text-light mb-4">Featured Projects</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
                Browse through our collection of handpicked projects across various categories. Filter by status or search to find exactly what you're looking for.
              </p>
            </div>

            <ProjectGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </div>
        </section>
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