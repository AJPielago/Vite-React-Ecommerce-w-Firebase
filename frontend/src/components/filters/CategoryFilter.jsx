import React from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

// This could be fetched from an API in a real app
const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'books', name: 'Books' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'sports', name: 'Sports & Outdoors' },
  { id: 'beauty', name: 'Beauty & Personal Care' },
  { id: 'toys', name: 'Toys & Games' },
];

const CategoryFilter = () => {
  const { filters, setFilter } = useFilters();
  const selectedCategories = filters.category ? filters.category.split(',') : [];

  const handleCategoryChange = (categoryId, isChecked) => {
    let newCategories = [...selectedCategories];
    
    if (isChecked) {
      newCategories.push(categoryId);
    } else {
      newCategories = newCategories.filter(id => id !== categoryId);
    }

    setFilter({
      category: newCategories.length > 0 ? newCategories.join(',') : '',
    });
  };

  const clearCategories = () => {
    setFilter({ category: '' });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Categories</h3>
        {selectedCategories.length > 0 && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={clearCategories}
            className="h-auto p-0 text-sm"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
            />
            <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
              {category.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
