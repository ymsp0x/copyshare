import { useState, useDeferredValue, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Tag, Sun, Moon } from 'lucide-react';
import { TextLogo } from '../ui/Logo';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export default function Navbar({
  onSearch,
  onCategorySelect,
  selectedCategory
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Effect untuk mengirimkan query pencarian yang sudah di-debounce
  useEffect(() => {
    if (onSearch) {
      if (deferredSearchQuery.length > 0) {
         onSearch(deferredSearchQuery);
      } else if (selectedCategory !== null) {
         // Jika search bar kosong TAPI ada kategori terpilih, jangan lakukan pencarian proyek.
         // Biarkan filter kategori yang bekerja.
      } else {
         // Jika search bar kosong DAN tidak ada kategori terpilih, reset pencarian
         onSearch('');
      }
    }
  }, [deferredSearchQuery, onSearch, selectedCategory]);

  // Effect untuk menangani klik di luar dropdown kategori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.category-dropdown') &&
        !(event.target as HTMLElement).closest('.theme-toggle-button')
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchInputRef]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Selalu buka dropdown kategori jika ada teks atau jika input kosong tapi ingin melihat semua kategori
    setIsCategoryDropdownOpen(true);
    // Jika search bar dikosongkan dan sebelumnya ada kategori terpilih, reset kategori
    if (e.target.value.length === 0 && selectedCategory !== null) {
      onCategorySelect?.(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery); // Panggil langsung saat submit
    }
    setIsCategoryDropdownOpen(false); // Tutup dropdown setelah submit
  };

  const handleCategoryClick = (category: string | null) => {
    onCategorySelect?.(category); // Pilih kategori
    setSearchQuery(''); // Kosongkan search query saat kategori dipilih
    setIsCategoryDropdownOpen(false); // Tutup dropdown
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const showSearchAndCategories = location.pathname === '/';

  // Filter kategori yang ditampilkan di dropdown berdasarkan searchQuery
  const filteredCategories = CATEGORIES.filter(category =>
    category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="bg-white dark:bg-neutral-900 shadow-sm dark:shadow-neutral-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <TextLogo />
            </Link>
          </div>

          {showSearchAndCategories && (
            <div className="hidden md:block flex-1 max-w-md mx-8 relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={selectedCategory ? `Search projects in ${selectedCategory}...` : "Search projects or categories..."}
                  className="w-full rounded-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-text-dark dark:text-text-light placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  name="desktop_search_query" // <--- TAMBAHKAN INI
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
              </form>

              {/* Dropdown Kategori */}
              {isCategoryDropdownOpen && (searchQuery.length > 0 || selectedCategory === null || searchInputRef.current?.matches(':focus')) && (
                <div className="category-dropdown absolute left-0 right-0 mt-2 bg-white/10 dark:bg-neutral-800/20 border border-gray-200/20 dark:border-neutral-700/50 rounded-md shadow-lg py-1 z-10 max-h-60 overflow-y-auto backdrop-blur-md"> {/* MODIFIED: Tambahkan backdrop-filter dan warna latar belakang transparan */}
                  {/* Tombol 'All' */}
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-700",
                      selectedCategory === null ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : ''
                    )}
                  >
                    <Tag className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> All Projects
                  </button>
                  <div className="border-t border-gray-100 dark:border-neutral-700 my-1"></div>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-700",
                          selectedCategory === category ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : ''
                        )}
                      >
                        <Tag className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> {category}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No matching categories.</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-text-dark dark:text-text-light hover:text-primary-600 dark:hover:text-primary-400"
            >
              HOME
            </Link>
            {/* Tombol Toggle Tema */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-button p-2 rounded-full text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center">
            {/* Tombol Toggle Tema untuk Mobile */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-button p-2 rounded-full text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 mr-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-500 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search dan Categories di Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-2">
            <div className="container mx-auto px-4 space-y-3">
              {showSearchAndCategories && (
                <div className="relative">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      placeholder={selectedCategory ? `Search projects in ${selectedCategory}...` : "Search projects or categories..."}
                      className="w-full rounded-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-text-dark dark:text-text-light placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      name="mobile_search_query" // <--- TAMBAHKAN INI
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </form>
                  {isCategoryDropdownOpen && (searchQuery.length > 0 || selectedCategory === null || searchInputRef.current?.matches(':focus')) && (
                    <div className="category-dropdown absolute left-0 right-0 mt-2 bg-white/10 dark:bg-neutral-800/20 border border-gray-200/20 dark:border-neutral-700/50 rounded-md shadow-lg py-1 z-10 max-h-60 overflow-y-auto backdrop-blur-md"> {/* MODIFIED: Tambahkan backdrop-filter dan warna latar belakang transparan */}
                      <button
                        onClick={() => { handleCategoryClick(null); closeMenu(); }}
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-700",
                          selectedCategory === null ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : ''
                        )}
                      >
                        <Tag className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> All Projects
                      </button>
                      <div className="border-t border-gray-100 dark:border-neutral-700 my-1"></div>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => { handleCategoryClick(category); closeMenu(); }}
                            className={cn(
                              "flex items-center w-full px-4 py-2 text-sm text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-neutral-700",
                              selectedCategory === category ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : ''
                            )}
                          >
                            <Tag className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" /> {category}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No matching categories.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-text-dark dark:text-text-light hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400"
                onClick={closeMenu}
              >
                Projects
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}