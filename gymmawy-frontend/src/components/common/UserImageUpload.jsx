import React from 'react';
import ImageUpload from './ImageUpload';

const UserImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  initialImage = null, 
  className = '',
  showPreview = true,
  showDetails = true,
  uploadText = 'Click to select or drag and drop',
}) => {
  return (
    <ImageUpload
      onImageUpload={onImageUpload}
      onImageRemove={onImageRemove}
      initialImage={initialImage}
      className={className}
      maxSize={5 * 1024 * 1024} // 5MB
      acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
      showPreview={showPreview}
      showDetails={showDetails}
      variant="user"
      uploadText={uploadText}
      sizeText="PNG, JPG, GIF, WebP up to 5MB"
    />
  );
};

export default UserImageUpload;
