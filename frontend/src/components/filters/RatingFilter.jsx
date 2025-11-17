import React from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { Star, StarHalf } from 'lucide-react';
import { Button } from '../ui/button';

const RatingFilter = () => {
  const { filters, setFilter } = useFilters();
  const selectedRating = filters.rating || '';

  const handleRatingClick = (rating) => {
    setFilter({
      rating: selectedRating === rating ? '' : rating,
    });
  };

  const clearRating = () => {
    setFilter({ rating: '' });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400 fill-current"
            aria-hidden="true"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf
            key={i}
            className="h-4 w-4 text-yellow-400 fill-current"
            aria-hidden="true"
          />
        );
      } else {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300 fill-current"
            aria-hidden="true"
          />
        );
      }
    }

    return stars;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Customer Review</h3>
        {selectedRating && (
          <Button 
            variant="link" 
            size="sm" 
            onClick={clearRating}
            className="h-auto p-0 text-sm"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingClick(rating)}
            className={`flex items-center w-full p-2 rounded-md text-sm ${
              selectedRating === rating.toString() ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              {renderStars(rating)}
              <span className="ml-2 text-gray-600">
                {rating === 5 ? '5.0' : `${rating} & up`}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RatingFilter;
