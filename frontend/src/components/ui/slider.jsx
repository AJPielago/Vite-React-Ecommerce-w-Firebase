import React from 'react';

export const Slider = ({ className = '', ...props }) => (
  <input type="range" {...props} className={`w-full ${className}`} />
);

export default Slider;
