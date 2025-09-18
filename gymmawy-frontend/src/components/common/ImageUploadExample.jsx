import React, { useState } from 'react';
import ImageUpload from './ImageUpload';

// Example usage of ImageUpload component for different modules

const ImageUploadExample = () => {
  const [subscriptionImage, setSubscriptionImage] = useState('');
  const [programmeImage, setProgrammeImage] = useState('');
  const [productImage, setProductImage] = useState('');
  const [cmsImage, setCmsImage] = useState('');

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">ImageUpload Component Examples</h1>
      
      {/* Subscription Plans Example */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Subscription Plans</h2>
        <ImageUpload
          value={subscriptionImage}
          onChange={setSubscriptionImage}
          module="subscription-plans"
          showUrlInput={true}
          required={false}
          maxSize={5}
        />
      </div>

      {/* Programmes Example */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Programmes</h2>
        <ImageUpload
          value={programmeImage}
          onChange={setProgrammeImage}
          module="programmes"
          showUrlInput={true}
          required={true}
          maxSize={3}
        />
      </div>

      {/* Products Example */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Products</h2>
        <ImageUpload
          value={productImage}
          onChange={setProductImage}
          module="products"
          showUrlInput={false} // Only file upload, no URL input
          required={true}
          maxSize={2}
        />
      </div>

      {/* CMS Example */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">CMS (Transformations)</h2>
        <ImageUpload
          value={cmsImage}
          onChange={setCmsImage}
          module="cms"
          showUrlInput={true}
          required={false}
          maxSize={10}
        />
      </div>

      {/* Display current values */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Current Values:</h3>
        <pre className="text-sm">
          {JSON.stringify({
            subscriptionImage,
            programmeImage,
            productImage,
            cmsImage,
          }, null, 2)}
        </pre>
        
        {/* Show image previews if available */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {subscriptionImage && (
            <div>
              <h4 className="font-medium text-sm mb-2">Subscription Plan Image:</h4>
              <img src={subscriptionImage} alt="Subscription" className="w-full h-32 object-cover rounded" />
            </div>
          )}
          {programmeImage && (
            <div>
              <h4 className="font-medium text-sm mb-2">Programme Image:</h4>
              <img src={programmeImage} alt="Programme" className="w-full h-32 object-cover rounded" />
            </div>
          )}
          {productImage && (
            <div>
              <h4 className="font-medium text-sm mb-2">Product Image:</h4>
              <img src={productImage} alt="Product" className="w-full h-32 object-cover rounded" />
            </div>
          )}
          {cmsImage && (
            <div>
              <h4 className="font-medium text-sm mb-2">CMS Image:</h4>
              <img src={cmsImage} alt="CMS" className="w-full h-32 object-cover rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadExample;
