import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { serviceApi } from '../../services/api';
import { Button } from '../ui/button';
import { Trash2, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

const ServicesList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const limit = 10;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch services
  const { data, isLoading, error } = useQuery({
    queryKey: ['services', { page, limit, search }],
    queryFn: () => serviceApi.getServices(page, limit, search),
    keepPreviousData: true,
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (id) => serviceApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries('services');
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => serviceApi.bulkDeleteServices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries('services');
      setSelectedServices([]);
      toast.success('Selected services deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete services');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedServices.length === 0) {
      toast.warning('Please select at least one service to delete');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedServices.length} selected services?`)) {
      bulkDeleteMutation.mutate(selectedServices);
    }
  };

  const toggleSelectService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id)
        ? prev.filter(serviceId => serviceId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedServices.length === data?.data?.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(data?.data?.map(service => service._id) || []);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={() => navigate('/services/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search services..."
              className="px-4 py-2 border rounded-md w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedServices.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedServices.length})
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={data?.data?.length > 0 && selectedServices.length === data.data.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Skeleton loading state
                Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-md mr-3" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : data?.data?.length > 0 ? (
                data.data.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service._id)}
                        onChange={() => toggleSelectService(service._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {service.images && service.images.length > 0 ? (
                          <img
                            className="h-10 w-10 rounded-md object-cover mr-3"
                            src={service.images[0].url}
                            alt={service.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 mr-3">
                            <span>No Image</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{service.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${service.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{service.duration} minutes</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/services/edit/${service._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(service._id)}
                          disabled={deleteServiceMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No services found. Create your first service to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, data.pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{data.pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <span>«</span>
                  </button>
                  
                  {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (data.pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.pagination.pages - 2) {
                      pageNum = data.pagination.pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <span>»</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesList;
