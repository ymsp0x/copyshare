// project/src/components/projects/ProjectForm.tsx
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Upload } from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { slugify /* REMOVED CATEGORIES */ } from '../../lib/utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from 'react-select';
import RichTextEditor from '../ui/RichTextEditor';
import { useCategories } from '../../hooks/useCategories'; // IMPORT THE NEW HOOK

interface ProjectFormProps {
  project?: Project;
  isEditMode?: boolean;
}

type FormValues = {
  title: string;
  description: string;
  status: 'Aktif' | 'Segera' | 'Selesai';
  slug: string;
  project_url: string;
  categories: string[];
};

function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts.filter(Boolean).pop() || url;
  } catch (error) {
    return url;
  }
}

export default function ProjectForm({ project, isEditMode = false }: ProjectFormProps) {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(project?.image_url ? getFileNameFromUrl(project.image_url) : null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(project?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the new useCategories hook to fetch categories dynamically
  const { categoryNames, isLoading: areCategoriesLoading, error: categoriesError } = useCategories();
  
  // Format categories for react-select
  const categoryOptions = categoryNames.map(category => ({
    value: category,
    label: category,
  }));

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

  // Handle category loading/error for display to user
  useEffect(() => {
    if (categoriesError) {
      toast.error(`Error loading categories: ${categoriesError}`);
    }
  }, [categoriesError]);

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
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageFileName(null);
    setImagePreviewUrl(null);
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
      console.error('Supabase image upload error:', uploadError);
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

      // Check if description is truly empty or just HTML tags
      const strippedDescription = data.description.replace(/<(?:.|\n)*?>/gm, '').trim();
      const finalDescription = strippedDescription === '' ? '' : data.description;

      if (isEditMode && project) {
        const { error } = await supabase
          .from('projects')
          .update({
            ...data,
            description: finalDescription,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (error) {
          console.error('Supabase project update error:', error);
          throw error;
        }

        toast.success('Project updated successfully');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            ...data,
            description: finalDescription,
            image_url: imageUrl,
          });

        if (error) {
          console.error('Supabase project creation error:', error);
          throw error;
        }

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

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-white)',
      borderColor: state.isFocused
        ? 'var(--border-blue-500)'
        : (errors.categories ? 'var(--border-red-500)' : 'var(--border-neutral-300)'),
      boxShadow: state.isFocused ? '0 0 0 1px var(--ring-blue-500)' : 'none',
      borderRadius: '0.5rem',
      minHeight: '42px',
      color: 'var(--text-neutral-900)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--border-blue-500)' : 'var(--border-neutral-400)',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--text-neutral-900)',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--text-neutral-400)',
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-white)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border-neutral-300)',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--color-primary-500)'
        : state.isFocused
        ? 'var(--bg-neutral-100)'
        : 'var(--bg-white)',
      color: state.isSelected
        ? 'white'
        : 'var(--text-neutral-900)',
      '&:active': {
        backgroundColor: 'var(--color-primary-600)',
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-primary-50)',
      borderRadius: '0.5rem',
      color: 'var(--text-primary-700)',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'var(--text-primary-700)',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'var(--text-primary-700)',
      '&:hover': {
        backgroundColor: 'var(--bg-primary-100)',
        color: 'var(--text-primary-800)',
      },
    }),
  };

  return (
    <div className="w-full px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-8 text-center">
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full md:max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8" style={{ overflow: 'visible' }}>

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
            {...register('slug', {
              required: 'Slug is required',
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug must be lowercase letters, numbers, and hyphens only.'
              }
            })}
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
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => field.onBlur()}
                  placeholder="Enter project description with rich text formatting..."
                  minHeight="180px"
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

        {/* --- Bagian Kategori dengan React-Select --- */}
        <div>
          <label htmlFor="categories" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Categories
          </label>
          <Controller
            name="categories"
            control={control}
            rules={{
              required: 'At least one category is required',
              validate: (value) => (value && value.length > 0) || 'At least one category is required',
            }}
            render={({ field }) => (
              <Select
                {...field}
                id="categories"
                options={categoryOptions} // Use dynamically fetched options
                isMulti
                classNamePrefix="react-select"
                placeholder="Select categories..."
                styles={customSelectStyles}
                value={field.value ? categoryOptions.filter(option => field.value.includes(option.value)) : []}
                onChange={(selectedOptions) => {
                  field.onChange(selectedOptions ? selectedOptions.map(option => option.value) : []);
                }}
                maxMenuHeight={200}
                isLoading={areCategoriesLoading} // Show loading state for categories
                isDisabled={areCategoriesLoading || categoriesError !== null} // Disable if loading or error
              />
            )}
          />
          {errors.categories && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.categories.message}</p>
          )}
          {categoriesError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Error loading categories.</p>
          )}
        </div>
        {/* --- Akhir Bagian Kategori dengan React-Select --- */}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">
            Project Image
          </label>

          {imagePreviewUrl ? (
            <div className="relative mb-4 flex flex-col sm:flex-row items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600">
              <div className="flex items-center flex-1 sm:pr-4 mb-3 sm:mb-0 w-full sm:w-auto">
                <img src={imagePreviewUrl} alt="Project Preview" className="w-16 h-16 object-cover rounded mr-4 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                  {imageFileName}
                </span>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="p-1 bg-white dark:bg-neutral-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200 flex-shrink-0 self-end sm:self-center"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ) : (
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full
              min-h-40 py-12 md:h-56
              border-2 border-dashed rounded-xl cursor-pointer bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
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

        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-neutral-100 dark:border-neutral-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto px-5 py-2.5 text-base"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 text-base"
          >
            {isEditMode ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
}