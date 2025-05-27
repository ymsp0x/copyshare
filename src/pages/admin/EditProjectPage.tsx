// project/src/pages/admin/EditProjectPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types/database.types';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectForm from '../../components/projects/ProjectForm';

function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        navigate('/admin');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark"> {/* MODIFIED */}
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div> {/* MODIFIED */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark"> {/* MODIFIED */}
      <AdminSidebar />
      
      <div className="flex-1 lg:ml-64 overflow-auto">
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark dark:text-text-light">Edit Project</h1> {/* MODIFIED */}
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Update project information
            </p>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
            {project && <ProjectForm project={project} isEditMode={true} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default EditProjectPage;