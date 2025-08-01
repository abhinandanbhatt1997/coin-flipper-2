import React from 'react';

const Loader: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600"></div>
  </div>
);

export default Loader;
