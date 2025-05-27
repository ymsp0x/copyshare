// project/src/pages/admin/NewProjectPage.tsx
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectForm from '../../components/projects/ProjectForm';

function NewProjectPage() {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark"> {/* MODIFIED */}
      <AdminSidebar />
      
      <div className="flex-1 lg:ml-64 overflow-auto">
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark dark:text-text-light">Create New Project</h1> {/* MODIFIED */}
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Add a new project to your portfolio
            </p>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
            <ProjectForm />
          </div>
        </main>
      </div>
    </div>
  );
}

export default NewProjectPage;