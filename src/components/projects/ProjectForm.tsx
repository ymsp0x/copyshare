import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Upload } from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { slugify, CATEGORIES } from '../../lib/utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Keep Quill's default theme CSS for base styling

interface ProjectFormProps {
  project?: Project;
  isEditMode?: boolean;
}

type FormValues = {
  title: string;
  description: string; // Quill outputs HTML string
  status: 'Aktif' | 'Segera' | 'Selesai';
  slug: string;
  project_url: string;
  categories: string[];
};

export default function ProjectForm({ project, isEditMode = false }: ProjectFormProps) {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(project?.image_url ? getFileNameFromUrl(project.image_url) : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      status: project?.status || 'Aktif',
      slug: project?.slug || '',
      project_url: project?.project_url || '',
      categories: project?.categories || [],
    }
  });

  const watchTitle = watch('title');

  useEffect(() => {
    if (!isEditMode || (isEditMode && !project?.slug)) {
      if (watchTitle) {
        setValue('slug', slugify(watchTitle));
      }
    }
  }, [watchTitle, setValue, isEditMode, project?.slug]);

  function getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      return parts.filter(Boolean).pop() || url;
    } catch (error) {
      return url;
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!acceptedImageTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, GIF, or WebP images are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      setImageFileName(file.name);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageFileName(null);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `project-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      let imageUrl = project?.image_url || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else if (imageFileName === null && project?.image_url) {
        imageUrl = null;
      }

      const sanitizedDescription = data.description === '<p><br></p>' ? '' : data.description;

      if (isEditMode && project) {
        const { error } = await supabase
          .from('projects')
          .update({
            ...data,
            description: sanitizedDescription,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (error) throw error;

        toast.success('Project updated successfully');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            ...data,
            description: sanitizedDescription,
            image_url: imageUrl,
          });

        if (error) throw error;

        toast.success('Project created successfully');
      }

      navigate('/admin');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} project: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'font', 'list', 'bullet', 'bold', 'italic', 'underline',
    'strike', 'color', 'background', 'align', 'link'
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-8 text-center">
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 md:p-8 space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input
            id="title"
            label="Project Title"
            placeholder="Enter project title"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          <Input
            id="slug"
            label="Slug (URL friendly name)"
            placeholder="project-name"
            {...register('slug', { required: 'Slug is required' })}
            error={errors.slug?.message}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            rules={{
              required: 'Description is required',
              validate: (value: string) => {
                const strippedValue = value.replace(/<(?:.|\n)*?>/gm, '').trim();
                return strippedValue.length > 0 || 'Description is required';
              }
            }}
            render={({ field }) => (
              <div className={
                `rounded-lg shadow-sm
                ${errors.description ? 'border-red-500 dark:border-red-400 ring-red-500' : 'border-neutral-300 dark:border-neutral-700 ring-blue-500'}
                focus-within:ring-2 focus-within:border-blue-500 dark:focus-within:border-blue-500 border`
              }>
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => field.onBlur()} // Ensure onBlur is called
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter project description with rich text formatting..."
                  className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" // Apply background and text color to Quill container
                  // Directly target Quill's content area for text color
                  // You might need a global CSS file for more detailed Quill overrides,
                  // especially for toolbar background/colors in dark mode.
                  // For example, in a global.css:
                  // .dark .ql-toolbar.ql-snow { background-color: theme('colors.neutral.800'); border-color: theme('colors.neutral.700'); }
                  // .dark .ql-editor { color: theme('colors.neutral.100'); }
                />
              </div>
            )}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Status
            </label>
            <select
              id="status"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-200"
              {...register('status', { required: 'Status is required' })}
            >
              <option value="Aktif">Aktif</option>
              <option value="Segera">Segera</option>
              <option value="Selesai">Selesai</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
            )}
          </div>

          <Input
            id="project_url"
            label="Project URL (Optional)"
            type="url"
            placeholder="https://example.com"
            {...register('project_url')}
            error={errors.project_url?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">
            Categories
          </label>
          <Controller
            control={control}
            name="categories"
            rules={{ required: 'At least one category is required' }}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const isSelected = field.value.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-sm
                        ${isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600'
                        }`}
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(field.value.filter((c: string) => c !== category));
                        } else {
                          field.onChange([...field.value, category]);
                        }
                      }}
                    >
                      {category}
                      {isSelected && <X className="inline ml-1 h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.categories && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.categories.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">
            Project Image
          </label>

          {imageFileName ? (
            <div className="relative mb-4 flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600">
              <div className="flex items-center">
                <Upload className="w-5 h-5 mr-3 text-neutral-500 dark:text-neutral-400" />
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                  {imageFileName}
                </span>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="p-1 bg-white dark:bg-neutral-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ) : (
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-neutral-400 dark:text-neutral-500" />
                <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">JPG, PNG, GIF, WebP (Max 5MB)</p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-100 dark:border-neutral-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 text-base"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="px-5 py-2.5 text-base"
          >
            {isEditMode ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
}