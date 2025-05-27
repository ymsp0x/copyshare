// project/src/pages/admin/NewProjectPage.tsx
import AdminSidebar from '../../components/admin/AdminSidebar';
import ProjectForm from '../../components/projects/ProjectForm';

function NewProjectPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 font-sans antialiased">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto lg:ml-64 pt-16 lg:pt-0">
        <main className="p-6 md:p-10">
          {/* Removed the heading and paragraph here */}
          {/*
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50">
              Create New Project
            </h1>
            <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 mt-2">
              Add a new project to your portfolio with all the details.
            </p>
          </div>
          */}

          <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 md:p-8">
            <ProjectForm />
          </div>
        </main>
      </div>
    </div>
  );
}

export default NewProjectPage;