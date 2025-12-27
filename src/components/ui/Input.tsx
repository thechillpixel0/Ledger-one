import React, { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  icon?: ReactNode;
  helperText?: string;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  label, 
  error, 
  icon, 
  helperText, 
  className = '', 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${icon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
            block w-full rounded-lg border-gray-300 shadow-sm 
            focus:border-blue-500 focus:ring-blue-500 transition-colors
            ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}