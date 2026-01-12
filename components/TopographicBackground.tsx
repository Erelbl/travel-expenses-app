import React from 'react';

/**
 * Simple Background - Calm utility app
 * Very light sky color, no decorations
 */
const TopographicBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundColor: '#f0f9ff', // Very light sky - TWEAK HERE
      }}
      aria-hidden="true"
    />
  );
};

export default TopographicBackground;

