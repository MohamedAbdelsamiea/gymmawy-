import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  // State for product interactions
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Static product data with multiple images
  const products = [
    {
      id: 1,
      name: "ORIGINAL GYMMAWY BLACK COMPRESSION",
      price: 1299,
      discountedPrice: 899,
      images: [
        "store/product1-1.png",
        "store/product1-2.png", 
        "store/product1-3.png",
        "store/product1-4.png"
      ],
      hasDiscount: true,
      sizes: ['S', 'M', 'L', 'XL'],
      description: "High-quality compression shirt designed for maximum performance and comfort during your workouts.",
      productDetails: "Made from premium moisture-wicking fabric with compression technology. Features ergonomic seams and flatlock stitching for maximum comfort. Perfect for intense workouts and training sessions.",
      careInstructions: "Machine wash cold with like colors. Do not bleach. Tumble dry low. Iron on low heat if needed. Do not dry clean.",
      sizeChart: "S: Chest 36-38\", M: Chest 38-40\", L: Chest 40-42\", XL: Chest 42-44\""
    },
    {
      id: 2,
      name: "ORIGINAL GYMMAWY BLACK PANTS",
      price: 1600,
      discountedPrice: 1340,
      images: [
        "store/product2-1.png",
        "store/product2-2.png",
        "store/product2-3.png", 
        "store/product2-4.png"
      ],
      hasDiscount: true,
      sizes: ['S', 'M', 'L', 'XL'],
      description: "Premium black pants perfect for training and casual wear with superior comfort and style.",
      productDetails: "Crafted from high-quality stretch fabric with reinforced knees and seat. Features multiple pockets and elastic waistband for comfort and functionality.",
      careInstructions: "Machine wash cold. Do not bleach. Tumble dry low. Iron on medium heat. Do not dry clean.",
      sizeChart: "S: Waist 30-32\", M: Waist 32-34\", L: Waist 34-36\", XL: Waist 36-38\""
    }
  ];

  const product = products.find(p => p.id === parseInt(id)) || products[0];
  const currentImage = useAsset(product.images[currentImageIndex], "common");

  // Helper functions
  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const goToImage = (index) => {
    if (isTransitioning || index === currentImageIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const toggleAccordion = (section) => {
    setExpandedAccordion(expandedAccordion === section ? null : section);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    try {
      // For now, just show success message
      showSuccess(`Added ${quantity} ${product.name} (Size: ${selectedSize}) to cart`);
    } catch (error) {
      showError('Failed to add product to cart');
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    // For now, just show success message
    showSuccess('Redirecting to checkout...');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
          {/* Product Image Carousel */}
          <div className="relative">
            <div className="aspect-square relative overflow-hidden">
              <div className="relative w-full h-full">
                <img
                  src={currentImage}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-all duration-300 ease-in-out ${
                    isTransitioning ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
                  }`}
                  key={currentImageIndex}
                />
              </div>
              
              {/* Carousel Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 p-2 sm:p-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6 text-[#190143]" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 p-2 sm:p-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6 text-[#190143]" />
                  </button>
                </>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 justify-center">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                      index === currentImageIndex 
                        ? 'ring-2 ring-[#190143] ring-opacity-30' 
                        : 'hover:bg-[#190143] hover:bg-opacity-10'
                    }`}
                  >
                    <img
                      src={useAsset(image, "common")}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6 px-4 sm:px-8 md:px-16 lg:px-28">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#190143] mb-3 sm:mb-4">{product.name}</h1>
              
              {/* Pricing */}
              <div className="mb-6">
                {product.hasDiscount ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-[#190143]">
                      {product.discountedPrice} L.E
                    </span>
                    <span className="text-2xl font-light text-gray-500 line-through">
                      {product.price} L.E
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-[#190143]">
                    {product.price} L.E
                  </span>
                )}
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-[#190143] mb-3">Size</h3>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 border border-[#190143] flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        selectedSize === size
                          ? 'bg-[#190143] text-white'
                          : 'bg-white text-[#190143] hover:bg-[#190143] hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector and Add to Cart */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-[#190143] mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#190143] w-28 h-12">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-8 h-12 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleQuantityChange(1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleQuantityChange(-1);
                        }
                      }}
                      className="w-12 h-12 text-center text-base font-medium text-[#190143] border-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-8 h-12 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    className="bg-[#190143] text-white px-6 py-3 text-base font-medium hover:bg-white hover:text-[#190143] hover:border-[#190143] border border-transparent transition-all duration-300 flex items-center justify-center gap-2 flex-1 h-12"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 13m-10 0h10" />
                    </svg>
                    ADD TO CART
                  </button>
                </div>
              </div>

              {/* Buy Now Button */}
              <div className="mb-6">
                <button
                  onClick={handleBuyNow}
                  className="bg-[#190143] text-white px-6 py-3 text-base font-medium hover:bg-white hover:text-[#190143] hover:border-[#190143] border border-transparent transition-all duration-300 w-full"
                >
                  BUY IT NOW
                </button>
              </div>

              {/* Accordion Sections */}
              <div className="space-y-2">
                {/* Product Details */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('details')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">PRODUCT DETAILS</span>
                    <Plus className={`w-4 h-4 text-[#190143] transition-transform duration-300 ${
                      expandedAccordion === 'details' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'details' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <ul className="space-y-1">
                          <li>• Advanced compression technology</li>
                          <li>• Moisture-wicking 250GSM Premium fabric</li>
                          <li>• AdvanxedFlex™ 3.0 Multi-Colored Signature Print Front, Back</li>
                        </ul>
                      </div>
                    )}
                </div>

                {/* Care & Maintenance */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('care')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">CARE & MAINTENANCE</span>
                    <Plus className={`w-4 h-4 text-[#190143] transition-transform duration-300 ${
                      expandedAccordion === 'care' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'care' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <p className="mb-2">To preserve the quality and fit of your product:</p>
                        <ul className="space-y-1">
                          <li>• Always iron inside out.</li>
                          <li>• Avoid hot water to maintain the elegance of the print and the perfect fit of the fabric.</li>
                        </ul>
                      </div>
                    )}
                </div>

                {/* Size Chart */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('size')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">SIZE CHART</span>
                    <Plus className={`w-4 h-4 text-[#190143] transition-transform duration-300 ${
                      expandedAccordion === 'size' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'size' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <img 
                          src="/assets/common/store/size-chart.png" 
                          alt="Size Chart" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-light text-[#190143] mb-8 text-center">RELATED ITEMS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.filter(p => p.id !== product.id).map((relatedProduct) => (
              <div key={relatedProduct.id} className="group cursor-pointer" onClick={() => navigate(`/product/${relatedProduct.id}`)}>
                <div className="aspect-square overflow-hidden mb-4">
                  <img
                    src={useAsset(relatedProduct.images[0], "common")}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-lg font-medium text-[#190143] mb-2">{relatedProduct.name}</h3>
                <div className="flex items-center space-x-2">
                  {relatedProduct.hasDiscount ? (
                    <>
                      <span className="text-lg font-light text-[#190143]">
                        {relatedProduct.discountedPrice} L.E
                      </span>
                      <span className="text-lg font-light text-gray-500 line-through">
                        {relatedProduct.price} L.E
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-light text-[#190143]">
                      {relatedProduct.price} L.E
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purple Separator Line */}
      <div className="pt-16 pb-2 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-px bg-[#190143]"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
