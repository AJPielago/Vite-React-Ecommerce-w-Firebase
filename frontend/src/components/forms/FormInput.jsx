import React from 'react';
import { useField } from 'formik';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const FormInput = ({ label, helpText, ...props }) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;
  const inputId = props.id || props.name;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={inputId}
          className={`block w-full rounded-md shadow-sm ${
            isError
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }`}
          {...field}
          {...props}
        />
        
        {isError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {isError ? (
        <p className="mt-2 text-sm text-red-600" id={`${inputId}-error`}>
          {meta.error}
        </p>
      ) : helpText ? (
        <p className="mt-2 text-sm text-gray-500" id={`${inputId}-description`}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
};

export default FormInput;
