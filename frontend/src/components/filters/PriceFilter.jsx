import React, { useState, useEffect } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const PriceFilter = ({ minPrice = 0, maxPrice = 1000, step = 10 }) => {
  const { filters, setFilter } = useFilters();
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ? Number(filters.minPrice) : minPrice,
    filters.maxPrice ? Number(filters.maxPrice) : maxPrice,
  ]);

  // Update local state when filters change from URL
  useEffect(() => {
    setPriceRange([
      filters.minPrice ? Number(filters.minPrice) : minPrice,
      filters.maxPrice ? Number(filters.maxPrice) : maxPrice,
    ]);
  }, [filters.minPrice, filters.maxPrice, minPrice, maxPrice]);

  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  const applyPriceFilter = () => {
    setFilter({
      minPrice: priceRange[0] === minPrice ? '' : priceRange[0],
      maxPrice: priceRange[1] === maxPrice ? '' : priceRange[1],
    });
  };

  const resetPriceFilter = () => {
    setPriceRange([minPrice, maxPrice]);
    setFilter({
      minPrice: '',
      maxPrice: '',
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium">Price Range</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="text-sm text-gray-500">Min</label>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              min={minPrice}
              max={maxPrice}
              step={step}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-500">Max</label>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              min={minPrice}
              max={maxPrice}
              step={step}
              className="w-full"
            />
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          min={minPrice}
          max={maxPrice}
          step={step}
          className="py-4"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>${minPrice}</span>
          <span>${maxPrice}</span>
        </div>
        <div className="flex space-x-2 pt-2">
          <Button 
            onClick={applyPriceFilter}
            size="sm"
            className="flex-1"
          >
            Apply
          </Button>
          {(filters.minPrice || filters.maxPrice) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetPriceFilter}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;
