import React, { useState } from 'react';
import './ImageWithFallback.css';

const ImageWithFallback = ({ src, fallbackEmoji, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`img-wrapper ${className || ''}`}>
      {!isLoaded && !hasError && (
        <div className="img-skeleton shimmer"></div>
      )}
      
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={`actual-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      ) : (
        <div className="img-fallback-placeholder">
          <span className="fallback-emoji">{fallbackEmoji}</span>
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;
