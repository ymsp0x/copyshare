// project/src/components/projects/ProjectForm.tsx
// Form untuk membuat atau mengedit proyek.
// Menyertakan validasi, upload gambar, dan logika pencegahan duplikasi judul proyek.

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Upload } from 'lucide-react';
import { Project } from '../../types/database.types'; // Import tipe Project
import { supabase } from '../../lib/supabase'; // Import Supabase client
import { slugify } from '../../lib/utils'; // Utility untuk slugify
import Button from '../ui/Button'; // Komponen Button
import Input from '../ui/Input'; // Komponen Input
import Select from 'react-select'; // Komponen Select untuk kategori
import RichTextEditor from '../ui/RichTextEditor'; // Komponen Rich Text Editor
import TextArea from '../ui/TextArea'; // Komponen TextArea
import { useCategories } from '../../hooks/useCategories'; // Hook untuk mengambil kategori

// Definisi props untuk komponen ProjectForm
interface ProjectFormProps {
  project?: Project; // Data proyek jika dalam mode edit
  isEditMode?: boolean; // Menunjukkan apakah form dalam mode edit
}

// Definisi tipe data formulir
type FormValues = {
  title: string;
  description: string; // Deskripsi utama (artikel/blog)
  status: 'Aktif' | 'Segera' | 'Selesai';
  image_url: string | null; // Tambahkan image_url ke FormValues untuk validasi
  project_url: string;
  slug: string;
  categories: string[]; // Kategori tambahan (selain Airdrop)
  airdrop_description: string; // Deskripsi singkat khusus Airdrop
  project_type: 'article' | 'airdrop' | 'both'; // Tipe proyek eksplisit
};

// Fungsi pembantu untuk mendapatkan nama file dari URL
function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts.filter(Boolean).pop() || url;
  } catch (error) {
    // Jika URL tidak valid, kembalikan saja URL-nya
    return url;
  }
}

export default function ProjectForm({ project, isEditMode = false }: ProjectFormProps) {
  const navigate = useNavigate();
  // State untuk manajemen gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(project?.image_url ? getFileNameFromUrl(project.image_url) : null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(project?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State untuk melacak status submit form

  // Mengambil daftar kategori dari hook kustom
  const { categoryNames, isLoading: areCategoriesLoading, error: categoriesError } = useCategories();

  // Mempersiapkan opsi untuk React-Select, mencakup semua kategori
  const categoryOptions = categoryNames.map(category => ({
    value: category,
    label: category,
  }));

  // Inisialisasi React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    setError: setFormError, // Untuk mengatur error form secara manual
    clearErrors, // Untuk membersihkan error form manual
  } = useForm<FormValues>({
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      status: project?.status || 'Aktif',
      slug: project?.slug || '',
      project_url: project?.project_url || '',
      categories: project?.categories || [], // Default kategori dari proyek
      airdrop_description: project?.airdrop_description || '',
      project_type: project?.project_type || (project?.categories?.includes('Airdrop') ? 'both' : 'article'), // Default tipe proyek
      image_url: project?.image_url || null, // Default image_url
    }
  });

  // Watch nilai dari field yang relevan untuk logika kondisional
  const watchTitle = watch('title');
  const watchProjectType = watch('project_type');
  const watchCategories = watch('categories');
  const watchImageUrl = watch('image_url'); // Watch image_url untuk validasi gambar

  // Variabel pembantu untuk tipe proyek
  const isAirdropType = watchProjectType === 'airdrop' || watchProjectType === 'both';
  const isArticleType = watchProjectType === 'article' || watchProjectType === 'both';

  // Efek untuk mengupdate slug secara otomatis dari title
  useEffect(() => {
    if (!isEditMode || (isEditMode && !project?.slug)) { // Hanya di mode buat baru atau jika slug belum ada di mode edit
      if (watchTitle && !dirtyFields.slug) { // Update slug hanya jika title diisi dan slug belum diedit manual
        setValue('slug', slugify(watchTitle));
      }
    }
  }, [watchTitle, setValue, isEditMode, project?.slug, dirtyFields.slug]);

  // Efek untuk menangani error saat mengambil kategori
  useEffect(() => {
    if (categoriesError) {
      toast.error(`Error loading categories: ${categoriesError.message}`);
    }
  }, [categoriesError]);

  // Efek untuk mensinkronkan kategori 'Airdrop' dengan project_type yang dipilih
  // Ini akan secara otomatis menambahkan/menghapus 'Airdrop' dari array kategori yang disimpan
  useEffect(() => {
    const currentCategories = watchCategories || [];
    // Jika project_type adalah Airdrop atau Both, pastikan 'Airdrop' ada di kategori
    if (isAirdropType && !currentCategories.includes('Airdrop')) {
      setValue('categories', [...currentCategories, 'Airdrop'], { shouldValidate: true });
    }
    // Jika project_type adalah Article, pastikan 'Airdrop' tidak ada di kategori
    else if (!isAirdropType && currentCategories.includes('Airdrop')) {
      setValue('categories', currentCategories.filter(cat => cat !== 'Airdrop'), { shouldValidate: true });
    }
  }, [isAirdropType, watchCategories, setValue]);

  // Handler untuk perubahan input gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!acceptedImageTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, GIF, or WebP images are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Batas ukuran 5MB
        toast.error('Image size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      setImageFileName(file.name);
      setImagePreviewUrl(URL.createObjectURL(file));
      setValue('image_url', URL.createObjectURL(file), { shouldValidate: true }); // Set URL gambar ke form value
      clearErrors('image_url'); // Hapus error terkait gambar jika upload berhasil
    }
  };

  // Handler untuk menghapus gambar
  const clearImage = () => {
    setImageFile(null);
    setImageFileName(null);
    setImagePreviewUrl(null);
    setValue('image_url', null, { shouldValidate: true }); // Set image_url di form value menjadi null
  };

  // Fungsi untuk mengunggah gambar ke Supabase Storage
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    // PENTING: Pastikan ini menggunakan BACKTICKS (`)
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

  // Handler utama untuk submit form
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      let imageUrlToSave = project?.image_url || null; // URL gambar yang sudah ada
      if (imageFile) { // Jika ada file baru yang diunggah
        imageUrlToSave = await uploadImage(imageFile);
      } else if (imageFileName === null && project?.image_url) { // Jika gambar yang ada dihapus
        imageUrlToSave = null;
      }
      // Validasi gambar: harus ada jika ini proyek baru atau edit tapi gambar dihapus
      if (!imageUrlToSave) {
        setFormError('image_url', { type: 'manual', message: 'Project image is required.' });
        toast.error('Project image is required.');
        setIsSubmitting(false);
        return;
      }


      // Proses deskripsi utama (artikel/blog)
      const strippedDescription = data.description.replace(/<(?:.|\n)*?>/gm, '').trim();
      const finalDescription = (isArticleType && strippedDescription === '') ? '' : data.description;

      // Proses deskripsi Airdrop singkat
      const strippedAirdropDescription = data.airdrop_description.replace(/<(?:.|\n)*?>/gm, '').trim();
      const finalAirdropDescription = (isAirdropType && strippedAirdropDescription === '') ? null : data.airdrop_description;

      // Validasi custom untuk memastikan deskripsi utama terisi jika tipe artikel/both
      if (isArticleType && strippedDescription === '') {
        setFormError('description', { type: 'manual', message: 'Main Description is required for this project type.' });
        toast.error('Main Description is required.');
        setIsSubmitting(false);
        return;
      }

      // Validasi custom untuk memastikan deskripsi Airdrop terisi jika tipe airdrop/both
      if (isAirdropType && strippedAirdropDescription === '') {
        setFormError('airdrop_description', { type: 'manual', message: 'Airdrop Description is required for this project type.' });
        toast.error('Airdrop Description is required.');
        setIsSubmitting(false);
        return;
      }


      if (isEditMode && project) {
        // Mode Edit: Langsung update proyek yang ada
        const { error } = await supabase
          .from('projects')
          .update({
            ...data,
            description: finalDescription,
            airdrop_description: finalAirdropDescription,
            image_url: imageUrlToSave, // Gunakan URL gambar yang sudah di proses
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (error) {
          console.error('Supabase project update error:', error);
          throw error;
        }

        toast.success('Project updated successfully');
      } else {
        // Mode Buat Baru: Lakukan pengecekan duplikasi judul + project_type sebelum insert
        const { data: existingProjects, error: fetchError } = await supabase
          .from('projects')
          .select('id, title, slug, project_type')
          .eq('title', data.title)
          .eq('project_type', data.project_type); // Periksa duplikasi berdasarkan judul DAN project_type

        if (fetchError) throw fetchError;

        if (existingProjects && existingProjects.length > 0) {
          const existingProject = existingProjects[0];
          // Tampilkan konfirmasi kepada admin jika ditemukan proyek dengan judul & tipe yang sama
          const confirmAction = window.confirm(
            `Proyek dengan judul "${data.title}" dan tipe "${data.project_type}" sudah ada (Slug: ${existingProject.slug}).\n\n` +
            `Pilih "OK" untuk mengedit proyek yang sudah ada ini (Anda akan diarahkan ke halaman edit).` +
            `\nPilih "Batal" untuk membatalkan pembuatan proyek baru.`
          );

          if (confirmAction) {
            navigate(`/admin/edit/${existingProject.id}`);
            toast.info(`Mengarahkan ke halaman edit proyek "${data.title}".`);
            return;
          } else {
            toast.error("Pembuatan proyek dibatalkan.");
            setIsSubmitting(false);
            return;
          }
        }

        // Lanjutkan dengan insert jika tidak ada duplikasi judul + project_type
        const { error } = await supabase
          .from('projects')
          .insert({
            ...data,
            description: finalDescription,
            airdrop_description: finalAirdropDescription,
            image_url: imageUrlToSave, // Gunakan URL gambar yang sudah di proses
          });

        if (error) {
          console.error('Supabase project creation error:', error);
          // Tangani error spesifik jika slug otomatis yang digenerate ternyata duplikat
          if (error.code === '23505' && error.details?.includes('slug')) {
            setFormError('slug', {
              type: 'manual',
              message: 'Slug sudah ada. Coba judul lain atau sesuaikan slug secara manual.'
            });
            toast.error("Gagal membuat proyek: Slug sudah ada. Coba judul lain atau sesuaikan slug.");
          } else {
            toast.error(`Failed to create project: ${error.message || 'Unknown error'}`);
          }
          throw error;
        }

        toast.success('Project created successfully');
      }

      navigate('/admin'); // Arahkan ke dashboard admin setelah berhasil
    } catch (error: any) {
      console.error('Error saving project:', error);
      // Hindari pesan toast ganda jika error sudah ditangani secara spesifik
      if (!errors.slug && !errors.description && !errors.airdrop_description && !errors.image_url && !isSubmitting) {
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} project: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state di akhir
    }
  };

  // Gaya kustom untuk React-Select
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

        {/* Pilihan Project Type (Radio Buttons) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Project Type
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('project_type', { required: 'Project Type is required' })}
                value="article"
                className="form-radio text-primary-600 dark:text-primary-400 h-4 w-4"
              />
              <span className="ml-2 text-neutral-700 dark:text-neutral-200">Article / General Project</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('project_type', { required: 'Project Type is required' })}
                value="airdrop"
                className="form-radio text-primary-600 dark:text-primary-400 h-4 w-4"
              />
              <span className="ml-2 text-neutral-700 dark:text-neutral-200">Airdrop Only</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('project_type', { required: 'Project Type is required' })}
                value="both"
                className="form-radio text-primary-600 dark:text-primary-400 h-4 w-4"
              />
              <span className="ml-2 text-neutral-700 dark:text-neutral-200">Article & Airdrop</span>
            </label>
          </div>
          {errors.project_type && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.project_type.message}</p>
          )}
        </div>

        {/* Deskripsi Utama (Artikel/Blog) - Muncul jika tipe adalah 'article' atau 'both' */}
        {isArticleType && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Main Description (Article/Blog Content)
            </label>
            <Controller
              name="description"
              control={control}
              rules={{
                required: isArticleType ? 'Main Description is required for this type' : false,
                validate: (value: string) => {
                  if (!isArticleType) return true;
                  const strippedValue = value.replace(/<(?:.|\n)*?>/gm, '').trim();
                  return strippedValue.length > 0 || 'Main Description is required';
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
                    placeholder="Enter project main description with rich text formatting (article/blog content)..."
                    minHeight="180px"
                  />
                </div>
              )}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>
        )}

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

        {/* Deskripsi Airdrop Singkat - Muncul jika tipe adalah 'airdrop' atau 'both' */}
        {isAirdropType && (
          <div>
            <TextArea
              id="airdrop_description"
              label="Airdrop Short Description (Optional)"
              placeholder="Enter a brief description specific to the Airdrop activity..."
              {...register('airdrop_description', {
                required: isAirdropType ? 'Airdrop Description is required for this type' : false,
              })}
              error={errors.airdrop_description?.message}
              rows={4}
            />
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              This description will be used on the Airdrop activities page and in brief listings for Airdrop projects.
            </p>
          </div>
        )}

        {/* Bagian Kategori (Multi-select) */}
        <div>
          <label htmlFor="categories" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Other Categories (e.g., DeFi, Tooling)
          </label>
          <Controller
            name="categories"
            control={control}
            rules={{
              validate: (value) => (value && value.length > 0) || 'Please select at least one category.',
            }}
            render={({ field }) => (
              <Select
                {...field}
                id="categories"
                options={categoryOptions} // Menggunakan semua kategori, termasuk 'Airdrop'
                isMulti
                classNamePrefix="react-select"
                placeholder="Select additional categories..."
                styles={customSelectStyles}
                value={field.value ? categoryOptions.filter(option => field.value.includes(option.value)) : []}
                onChange={(selectedOptions) => {
                  // React-Select mengirimkan objek { value, label }
                  const newSelectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
                  field.onChange(newSelectedValues);
                }}
                maxMenuHeight={200}
                isLoading={areCategoriesLoading}
                isDisabled={areCategoriesLoading || categoriesError !== null}
                // Nonaktifkan opsi 'Airdrop' untuk pemilihan manual
                isOptionDisabled={(option) => option.value === 'Airdrop'}
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
        {/* Akhir Bagian Kategori */}

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