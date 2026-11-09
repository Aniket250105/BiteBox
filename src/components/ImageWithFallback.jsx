import React, { useState } from 'react';
import './ImageWithFallback.css';
import { resolveDishImage } from '../utils/dishImageMatcher';

const ImageWithFallback = ({ src, fallbackEmoji, alt, className = '', isPlate = true, isVeg }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolved = resolveDishImage(alt, src, isVeg);
  const effectiveSrc = resolved.usePhoto ? resolved.src : null;
  const effectiveEmoji = fallbackEmoji || resolved.emoji;

  return (
    <div className={`img-wrapper ${isPlate ? 'plate' : ''} ${className}`}>
      {!isLoaded && !hasError && effectiveSrc && (
        <div className="img-skeleton shimmer" />
      )}
      
      {!hasError && effectiveSrc ? (
        <img
          src={effectiveSrc}
          alt={alt || 'Food item'}
          className={`actual-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      ) : (
        <div className="img-fallback-placeholder">
          <span className="fallback-emoji">{effectiveEmoji}</span>
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;
