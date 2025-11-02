import React from 'react';

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => {
  return (
    <div
      className={`${size} animate-spin rounded-full border-4 border-gray-300 border-t-blue-600`}
    ></div>
  );
};

export default Spinner;
