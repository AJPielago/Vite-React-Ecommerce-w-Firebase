import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { serviceApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { Loader2, X, Image as ImageIcon, Upload } from 'lucide-react';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .required('Price is required')
    .positive('Price must be positive'),
  duration: yup
    .number()
    .typeError('Duration must be a number')
    .required('Duration is required')
    .positive('Duration must be positive')
    .integer('Duration must be a whole number'),
  images: yup
    .mixed()
    .test('fileSize', 'File size is too large', (value) => {
      if (!value || value.length === 0) return true;
      return value.every((file) => file.size <= 5 * 1024 * 1024); // 5MB limit
    })
    .test('fileType', 'Unsupported file type', (value) => {
      if (!value || value.length === 0) return true;
      return value.every((file) =>
        ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
      );
    }),
});

const ServiceForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch service data if in edit mode
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => serviceApi.getServiceById(id),
    enabled: isEditMode,
    onSuccess: (data) => {
      setExistingImages(data.images || []);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      duration: '',
      images: [],
    },
  });

  // Set form values when service data is loaded
  useEffect(() => {
    if (isEditMode && serviceData) {
      reset({
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
      });
    }
  }, [serviceData, isEditMode, reset]);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const filePreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      isNew: true,
    }));

    setPreviewImages((prev) => [...prev, ...filePreviews]);
    
    // Update form value
    const currentFiles = watch('images') || [];
    setValue('images', [...currentFiles, ...files]);
  };

  // Remove an image preview
  const removeImage = (index, isExisting = false, imageId = null) => {
    if (isExisting && imageId) {
      // Mark existing image for deletion
      setExistingImages((prev) =>
        prev.map((img) =>
          img._id === imageId ? { ...img, markedForDeletion: true } : img
        )
      );
    } else {
      // Remove from preview and form values
      setPreviewImages((prev) => prev.filter((_, i) => i !== index));
      
      const currentFiles = watch('images');
      if (currentFiles && currentFiles.length > 0) {
        const newFiles = [...currentFiles];
        newFiles.splice(index, 1);
        setValue('images', newFiles);
      }
    }
  };

  // Restore an existing image that was marked for deletion
  const restoreImage = (imageId) => {
    setExistingImages((prev) =>
      prev.map((img) =>
        img._id === imageId ? { ...img, markedForDeletion: false } : img
      )
    );
  };

  // Create or update service mutation
  const mutation = useMutation({
    mutationFn: (data) =>
      isEditMode
        ? serviceApi.updateService(id, data)
        : serviceApi.createService(data),
    onSuccess: () => {
      const message = isEditMode
        ? 'Service updated successfully'
        : 'Service created successfully';
      toast.success(message);
      queryClient.invalidateQueries('services');
      navigate('/services');
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} service`
      );
    },
  });

  const onSubmit = async (data) => {
    setIsUploading(true);
    
    try {
      // Handle image deletions first
      const imagesToDelete = existingImages
        .filter((img) => img.markedForDeletion)
        .map((img) => img.public_id);

      // Delete images from Cloudinary
      await Promise.all(
        imagesToDelete.map((publicId) =>
          serviceApi.deleteServiceImage(id, publicId)
        )
      );

      // Prepare form data
      const formData = {
        ...data,
        // Only include images that are not marked for deletion
        existingImages: existingImages
          .filter((img) => !img.markedForDeletion)
          .map(({ url, public_id }) => ({ url, public_id })),
      };

      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while processing your request');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Service' : 'Add New Service'}
        </h1>
        <p className="text-gray-500">
          {isEditMode
            ? 'Update the service details below.'
            : 'Fill in the details to create a new service.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Website Development"
                {...register('name')}
                error={errors.name?.message}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 99.99"
                {...register('price')}
                error={errors.price?.message}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 60"
                {...register('duration')}
                error={errors.duration?.message}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the service in detail..."
              {...register('description')}
              error={errors.description?.message}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="mt-6 space-y-2">
            <Label>Images</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <span>Upload files</span>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG up to 5MB
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
            {errors.images && (
              <p className="text-sm text-red-500">{errors.images.message}</p>
            )}
          </div>

          {/* Image Previews */}
          {(previewImages.length > 0 || existingImages.length > 0) && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Selected Images
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Existing Images */}
                {existingImages.map(
                  (image) =>
                    !image.markedForDeletion && (
                      <div
                        key={image._id}
                        className="relative group rounded-md overflow-hidden border border-gray-200"
                      >
                        <img
                          src={image.url}
                          alt="Preview"
                          className="h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(0, true, image._id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                )}

                {/* Preview of newly uploaded images */}
                {previewImages.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group rounded-md overflow-hidden border border-gray-200"
                  >
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/services')}
            disabled={mutation.isLoading || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isLoading || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {(mutation.isLoading || isUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
