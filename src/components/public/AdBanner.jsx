import React, { useState } from 'react';
import './AdBanner.css';

const AdBanner = () => {
  const [isClosed, setIsClosed] = useState(false);

  // Replace with your ad banner image URL
  const adImageUrl = '/assets/hero.jpg';

  if (isClosed) return null;

  return (
    <div className="ad-banner">
      <img 
        src={adImageUrl} 
        alt="Advertisement Banner" 
        className="ad-banner-image"
      />
      <button 
        className="ad-banner-close" 
        onClick={() => setIsClosed(true)}
        aria-label="Close banner"
      >
        ×
      </button>
    </div>
  );
};

export default AdBanner;
