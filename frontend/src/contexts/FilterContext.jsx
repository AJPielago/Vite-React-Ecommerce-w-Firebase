import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const FilterContext = createContext();

const initialState = {
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  sort: 'latest',
  page: 1,
  limit: 12,
};

const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, ...action.payload, page: 1 }; // Reset to first page when filters change
    case 'RESET_FILTERS':
      return { ...initialState };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    default:
      return state;
  }
};

export const FilterProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialState,
    ...Object.fromEntries(searchParams.entries()),
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const setFilter = useCallback((filters) => {
    dispatch({ type: 'SET_FILTER', payload: filters });
    updateURL({ ...state, ...filters, page: 1 });
  }, [state, updateURL]);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
    updateURL(initialState);
  }, [updateURL]);

  const setPage = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    updateURL({ ...state, page });
  }, [state, updateURL]);

  const value = {
    filters: state,
    setFilter,
    resetFilters,
    setPage,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
