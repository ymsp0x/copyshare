// project/src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Button from '../../components/ui/Button';

function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0
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
      
      // Calculate stats
      const projectStats = {
        total: data?.length || 0,
        active: data?.filter(p => p.status === 'Aktif').length || 0,
        upcoming: data?.filter(p => p.status === 'Segera').length || 0,
        completed: data?.filter(p => p.status === 'Selesai').length || 0
      };
      
      setStats(projectStats);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setProjects(projects.filter(project => project.id !== id));
      setStats({
        ...stats,
        total: stats.total - 1,
        active: stats.active - (projects.find(p => p.id === id)?.status === 'Aktif' ? 1 : 0),
        upcoming: stats.upcoming - (projects.find(p => p.id === id)?.status === 'Segera' ? 1 : 0),
        completed: stats.completed - (projects.find(p => p.id === id)?.status === 'Selesai' ? 1 : 0)
      });
      
      toast.success('Project deleted successfully');
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { 
      title: 'Total Projects', 
      value: stats.total, 
      color: 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200', // MODIFIED
      icon: <CheckCircle className="h-5 w-5" />
    },
    { 
      title: 'Active Projects', 
      value: stats.active, 
      color: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200',
      icon: <CheckCircle className="h-5 w-5" />
    },
    { 
      title: 'Upcoming Projects', 
      value: stats.upcoming, 
      color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <Clock className="h-5 w-5" />
    },
    { 
      title: 'Completed Projects', 
      value: stats.completed, 
      color: 'bg-gray-50 text-gray-700 dark:bg-neutral-700 dark:text-gray-200', // MODIFIED
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark"> {/* MODIFIED */}
      <AdminSidebar />
      
      <div className="flex-1 lg:ml-64 overflow-auto">
        <main className="p-6 lg:p-8 pl-16 sm:pl-20">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-text-dark dark:text-text-light">Dashboard</h1> {/* MODIFIED */}
            <Link to="/admin/new">
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                New Project
              </Button>
            </Link>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className={`${stat.color} rounded-lg p-4 shadow-sm`}>
                <div className="flex items-center">
                  <div className="mr-3">{stat.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Search & Filter */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-text-dark dark:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-500" // MODIFIED
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          {/* Projects Table */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden mb-6">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div> {/* MODIFIED */}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center p-12">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">No projects found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'Projects will appear here once they are added'}
                </p>
                <Link to="/admin/new">
                  <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                  <thead className="bg-gray-50 dark:bg-neutral-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Categories
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Slug
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className={deleteId === project.id ? 'bg-red-50 dark:bg-red-900' : 'hover:bg-gray-50 dark:hover:bg-neutral-700'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img 
                                className="h-10 w-10 rounded-md object-cover" 
                                src={project.image_url || 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                                alt="" 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-text-dark dark:text-text-light"> {/* MODIFIED */}
                                {project.title}
                              </div>
                              {project.project_url && (
                                <a 
                                  href={project.project_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center" // MODIFIED
                                >
                                  Visit <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              project.status === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              project.status === 'Segera' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-200' // MODIFIED
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {project.categories?.slice(0, 2).map((category, index) => (
                              <span key={index} className="bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200 px-2 py-0.5 rounded text-xs"> {/* MODIFIED */}
                                {category}
                              </span>
                            ))}
                            {project.categories && project.categories.length > 2 && (
                              <span className="bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-200 px-2 py-0.5 rounded text-xs"> {/* MODIFIED */}
                                +{project.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {project.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {deleteId === project.id ? (
                            <div className="flex items-center justify-end space-x-2 text-red-600 dark:text-red-400">
                              <span className="flex items-center mr-2">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Confirm delete?
                              </span>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(project.id)}
                                isLoading={isDeleting}
                              >
                                Yes
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={cancelDelete}
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <Link to={`/admin/edit/${project.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => confirmDelete(project.id)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
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