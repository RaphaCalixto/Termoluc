import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Carregando dados...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative">
        <div className="w-10 h-10 border-3 border-slate-200 rounded-full"></div>
        <div className="w-10 h-10 border-3 border-termoluc-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-xs font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
};
