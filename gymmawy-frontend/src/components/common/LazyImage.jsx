import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage component with intersection observer for lazy loading
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 * @param {string} props.className - CSS classes
 * @param {string} props.placeholderSrc - Optional placeholder image
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onClick - Click handler
 * @param {string} props.loading - Native loading attribute (lazy/eager)
 */
const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  placeholderSrc = '', 
  style = {},
  onClick,
  loading = 'lazy',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image is in view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={style}
      onClick={onClick}
      loading={loading}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
};

export default LazyImage;

