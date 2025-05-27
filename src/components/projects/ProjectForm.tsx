// project/src/components/projects/ProjectForm.tsx
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Upload, Image } from 'lucide-react';
import { Project } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { slugify, CATEGORIES } from '../../lib/utils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';

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

export default function ProjectForm({ project, isEditMode = false }: ProjectFormProps) {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(project?.image_url || null);
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
    if (!project?.slug && watchTitle) {
      setValue('slug', slugify(watchTitle));
    }
  }, [watchTitle, setValue, project?.slug]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file);
    
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
      }
      
      if (isEditMode && project) {
        const { error } = await supabase
          .from('projects')
          .update({
            ...data,
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
            image_url: imageUrl,
          });
          
        if (error) throw error;
        
        toast.success('Project created successfully');
      }
      
      navigate('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} project`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Input
            id="title"
            label="Project Title"
            placeholder="Enter project title"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />
        </div>
        
        <div>
          <Input
            id="slug"
            label="Slug (URL friendly name)"
            placeholder="project-name"
            {...register('slug', { required: 'Slug is required' })}
            error={errors.slug?.message}
          />
        </div>
      </div>
      
      <div>
        <TextArea
          id="description"
          label="Description"
          rows={5}
          placeholder="Enter project description"
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-dark dark:text-text-light mb-1"> {/* MODIFIED */}
            Status
          </label>
          <select
            id="status"
            className="w-full rounded-md border border-gray-300 dark:border-neutral-700 shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-text-dark dark:text-text-light" // MODIFIED
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
        
        <div>
          <Input
            id="project_url"
            label="Project URL (Optional)"
            type="url"
            placeholder="https://example.com"
            {...register('project_url')}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-text-light mb-3"> {/* MODIFIED */}
          Categories
        </label>
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const isSelected = field.value.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300 dark:bg-primary-900 dark:text-primary-200 dark:ring-primary-600' // MODIFIED
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600'
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
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-text-light mb-3"> {/* MODIFIED */}
          Project Image
        </label>
        
        {imagePreview ? (
          <div className="relative mb-4">
            <img 
              src={imagePreview} 
              alt="Project preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-white dark:bg-neutral-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-neutral-600"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-neutral-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Image className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or GIF (Max 10MB)</p>
            </div>
            <input 
              id="image" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {isEditMode ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}