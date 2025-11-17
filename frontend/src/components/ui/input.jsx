import React from 'react';

export const Input = ({ className = '', ...props }) => (
  <input {...props} className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`} />
);

export default Input;
