import React from 'react';
import PriceFilter from './PriceFilter';
import CategoryFilter from './CategoryFilter';
import RatingFilter from './RatingFilter';
import { useFilters } from '../../contexts/FilterContext';
import { Button } from '../ui/button';

const FilterSidebar = () => {
  const { resetFilters, filters } = useFilters();
  
  // Check if any filters are active
  const isAnyFilterActive = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.rating;

  return (
    <div className="w-64 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {isAnyFilterActive && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={resetFilters}
            className="h-auto p-0 text-sm"
          >
            Clear all
          </Button>
        )}
      </div>
      
      <PriceFilter minPrice={0} maxPrice={1000} step={10} />
      <CategoryFilter />
      <RatingFilter />
      
      {/* Active filters */}
      {isAnyFilterActive && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {filters.category && filters.category.split(',').map(cat => (
              <span 
                key={cat} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {cat}
              </span>
            ))}
            
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ${filters.minPrice || '0'} - ${filters.maxPrice || '1000+'}
              </span>
            )}
            
            {filters.ating && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {filters.ating}★ & up
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;
