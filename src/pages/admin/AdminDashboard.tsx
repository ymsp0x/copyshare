import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Button from '../../components/ui/Button';
import ModernStats from '../../components/admin/ModernStats';

function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);

      const calculatedStats = {
        total: data?.length || 0,
        active: data?.filter(p => p.status === 'Aktif').length || 0,
        upcoming: data?.filter(p => p.status === 'Segera').length || 0,
        completed: data?.filter(p => p.status === 'Selesai').length || 0,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (id: string) => setDeleteId(id);

  const cancelDelete = () => setDeleteId(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const originalProjects = projects; // Store current state for rollback
    const originalStats = stats;

    const deletedProject = projects.find(p => p.id === id);
    if (!deletedProject) {
      setIsDeleting(false);
      setDeleteId(null);
      return;
    }

    // Optimistic UI Update: Remove project immediately
    setProjects(prev => prev.filter(project => project.id !== id));
    const updatedStats = { ...stats };
    updatedStats.total -= 1;
    switch (deletedProject.status) {
      case 'Aktif': updatedStats.active -= 1; break;
      case 'Segera': updatedStats.upcoming -= 1; break;
      case 'Selesai': updatedStats.completed -= 1; break;
    }
    setStats(updatedStats);
    toast.success('Project deleted successfully (optimistic)'); // Indicate optimistic update

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        throw error; // Propagate error for catch block
      }
      toast.success('Project deletion confirmed!'); // Confirmed by server
    } catch (error) {
      console.error('Error deleting project:', error);
      // Rollback UI if delete failed
      setProjects(originalProjects);
      setStats(originalStats);
      toast.error('Failed to delete project, rolling back changes.');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 font-sans antialiased">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto lg:ml-64 pt-16 lg:pt-0">
        <main className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">Dashboard</h1>
            <Link to="/admin/new">
              <Button className="flex items-center px-4 py-2 text-sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Modern Stats */}
          <div className="mb-10">
            <ModernStats stats={stats} />
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search projects by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out placeholder-neutral-400"
            />
          </div>

          {/* Projects Table */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-neutral-100 dark:border-neutral-700">
            {isLoading ? (
              <div className="flex justify-center items-center p-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center p-16">
                <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-3">No projects found</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No results match your search. Try a different query.'
                    : 'Get started by creating your first project. They will appear here once added.'}
                </p>
                <Link to="/admin/new">
                  <Button className="flex items-center px-4 py-2 text-sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Categories</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className={`${deleteId === project.id ? 'bg-red-50 dark:bg-red-950' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'} transition-colors duration-150`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-neutral-100 dark:border-neutral-700"
                              src={project.image_url || 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg'}
                              alt=""
                            />
                            <div className="ml-4">
                              <div className="text-base font-medium text-neutral-900 dark:text-neutral-100">{project.title}</div>
                              {project.project_url && (
                                <a
                                  href={project.project_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mt-1"
                                >
                                  Visit <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'Aktif'
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : project.status === 'Segera'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100'
                              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {project.categories?.slice(0, 2).map((category, index) => (
                              <span key={index} className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2.5 py-1 rounded-full text-xs font-medium">
                                {category}
                              </span>
                            ))}
                            {project.categories && project.categories.length > 2 && (
                              <span className="bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 px-2.5 py-1 rounded-full text-xs font-medium">
                                +{project.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 truncate max-w-xs">
                          {project.slug}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          {deleteId === project.id ? (
                            <div className="flex items-center justify-end space-x-3 text-red-600 dark:text-red-400">
                              <span className="flex items-center text-sm mr-2 font-semibold">
                                <AlertTriangle className="h-4 w-4 mr-1.5" />
                                Confirm delete?
                              </span>
                              <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)} isLoading={isDeleting}>
                                Yes
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelDelete}>
                                No
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <Link to={`/admin/edit/${project.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(project.id)}
                                className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;