// project/src/components/admin/AdminSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TextLogo } from '../ui/Logo';
import { LayoutDashboard, PlusCircle, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />
    },
    {
      path: '/admin/new',
      label: 'Add Project',
      icon: <PlusCircle className="mr-3 h-5 w-5" />
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {/* This button is fixed and will sit above the main content on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-white dark:bg-neutral-800 shadow-md text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white dark:bg-neutral-900 shadow-md z-40",
          "fixed inset-y-0 left-0 w-64 transition-transform duration-300 ease-in-out transform lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
            <TextLogo />
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200" // Updated active state colors for consistency
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400" // Updated hover state colors
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile - covers content when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default AdminSidebar;