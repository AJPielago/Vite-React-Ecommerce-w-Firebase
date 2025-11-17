import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/orderApi';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  TruckIcon,
  SearchIcon,
  FilterIcon
} from '@heroicons/react/24/outline';
import OrderList from '../../components/orders/OrderList';

export default function OrdersPage() {
  const location = useLocation();
  const [filters, setFilters] = useState({
    status: new URLSearchParams(location.search).get('status') || '',
    search: '',
    page: parseInt(new URLSearchParams(location.search).get('page')) || 1,
    limit: 10
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminOrders', filters],
    queryFn: () => getOrders(filters),
    keepPreviousData: true
  });

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? '' : status,
      page: 1
    }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo(0, 0);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center
      
      ">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage customer orders
          </p>
        </div>
      </div>

      <div className="mt-8">
        <OrderList />
      </div>
    </div>
  );
}
