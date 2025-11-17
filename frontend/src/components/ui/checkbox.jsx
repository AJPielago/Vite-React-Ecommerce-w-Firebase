import React from 'react';

export const Checkbox = ({ checked, onChange, id, className = '' }) => (
  <input id={id} type="checkbox" checked={checked} onChange={onChange} className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${className}`} />
);

export default Checkbox;
