import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Gift, Package, ShoppingBag, BookOpen, Star, X, FileText } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import rewardsService from '../../services/rewardsService';
import { getFullImageUrl } from '../../utils/imageUtils';
import { getGymmawyCoinIcon } from '../../utils/currencyUtils';

const RewardsPage = () => {
  const { t, i18n } = useTranslation('rewards');
  const { user, isAuthenticated } = useAuth();
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('packages');
  const [rewards, setRewards] = useState({
    packages: [],
    products: [],
    programmes: []
  });
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInsufficientPointsPopup, setShowInsufficientPointsPopup] = useState(false);
  const [insufficientPointsData, setInsufficientPointsData] = useState(null);
  const [error, setError] = useState(null);
  const [redeeming, setRedeeming] = useState({});

  // Remove automatic login popup - let users see rewards first, then prompt for login when they try to redeem

  // Fetch rewards from backend API
  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true);
      try {
        // Fetch all categories of rewards in parallel
        // Note: Subscriptions might require authentication, so we handle it gracefully
        const [packagesResponse, productsResponse, programmesResponse] = await Promise.allSettled([
          rewardsService.getPackageRewards({ language: i18n.language }).catch(err => {
            console.log('Packages endpoint requires authentication or has no Gymmawy Coins items:', err.message);
            return null; // Return null for packages if auth required
          }),
          rewardsService.getProductRewards({ language: i18n.language }),
          rewardsService.getProgrammeRewards({ language: i18n.language })
        ]);

        const fetchedRewards = {
          packages: [],
          products: [],
          programmes: []
        };

        // Helper function to get bilingual text for packages and programmes
        const getBilingualText = (text, fallback = '') => {
          if (!text) return fallback;
          if (typeof text === 'object') {
            return isArabic && text.ar ? text.ar : text.en || text.ar || fallback;
          }
          return text;
        };

        // Helper function to get English-only text for products
        const getEnglishText = (text, fallback = '') => {
          if (!text) return fallback;
          if (typeof text === 'object') {
            return text.en || text.ar || fallback;
          }
          return text;
        };

        // Process packages (handle case where auth is required)
        if (packagesResponse.status === 'fulfilled' && packagesResponse.value && packagesResponse.value.items) {
          fetchedRewards.packages = packagesResponse.value.items
            .filter(item => (item.loyaltyPointsRequired || item.pointsRequired || 0) > 0) // Only show items with Gymmawy Coins
            .map(item => {
              // Debug logging for packages
              console.log('Package item:', item.name, 'ImageUrl:', item.imageUrl, 'Final URL:', item.imageUrl ? getFullImageUrl(item.imageUrl) : null);
              
              return {
                id: item.id,
                name: getBilingualText(item.name || item.title, 'Package'),
                pointsRequired: item.loyaltyPointsRequired || item.pointsRequired || 0,
                image: item.imageUrl ? getFullImageUrl(item.imageUrl) : null,
                category: 'packages',
                originalData: item
              };
            });
        }

        // Process products
        if (productsResponse.status === 'fulfilled' && productsResponse.value && productsResponse.value.items) {
          fetchedRewards.products = productsResponse.value.items
            .filter(item => (item.loyaltyPointsRequired || item.pointsRequired || 0) > 0) // Only show items with Gymmawy Coins
            .map(item => {
            // Handle product images - products use an images array with isPrimary flag
            const primaryImage = item.images?.find(img => img.isPrimary) || item.images?.[0];
            const imageUrl = primaryImage?.url ? getFullImageUrl(primaryImage.url) : null;
            
            // Debug logging for products
            console.log('Product item:', item.name, 'Images:', item.images, 'Primary image:', primaryImage, 'Final URL:', imageUrl);
            
            return {
              id: item.id,
              name: getEnglishText(item.name || item.title, 'Product'),
              pointsRequired: item.loyaltyPointsRequired || item.pointsRequired || 0,
              image: imageUrl,
              category: 'products',
              originalData: item
            };
          });
        }

        // Process programmes
        if (programmesResponse.status === 'fulfilled' && programmesResponse.value && programmesResponse.value.items) {
          fetchedRewards.programmes = programmesResponse.value.items
            .filter(item => (item.loyaltyPointsRequired || item.pointsRequired || 0) > 0) // Only show items with Gymmawy Coins
            .map(item => {
              // Debug logging for programmes
              console.log('Programme item:', item.name, 'ImageUrl:', item.imageUrl, 'Final URL:', item.imageUrl ? getFullImageUrl(item.imageUrl) : null);
              
              return {
                id: item.id,
                name: getBilingualText(item.name || item.title, 'Programme'),
                pointsRequired: item.loyaltyPointsRequired || item.pointsRequired || 0,
                image: item.imageUrl ? getFullImageUrl(item.imageUrl) : null,
                category: 'programmes',
                originalData: item
              };
            });
        }

        setRewards(fetchedRewards);
        setError(null);
      } catch (error) {
        console.error('Error fetching rewards:', error);
        setError(error.message || 'Failed to load rewards');
        // Fallback to empty state on error
        setRewards({
          packages: [],
          products: [],
          programmes: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [i18n.language]);

  const categories = [
    { key: 'packages', label: t('categories.packages') || 'Packages', icon: BookOpen },
    { key: 'products', label: t('categories.products') || 'Products', icon: ShoppingBag },
    { key: 'programmes', label: t('categories.programmes') || 'Programmes', icon: FileText }
  ];

  const userPoints = user?.loyaltyPoints || 0;

  const canRedeem = (pointsRequired) => {
    return isAuthenticated && userPoints >= pointsRequired;
  };

  // Helper function to get the "no items" translation key
  const getNoItemsKey = (category) => {
    switch (category) {
      case 'packages':
        return 'noPackages';
      case 'products':
        return 'noProducts';
      case 'programmes':
        return 'noProgrammes';
      default:
        return 'noRewards';
    }
  };

  const handleRedeem = async (reward) => {
    if (!isAuthenticated) {
      // Show login popup when user clicks on locked item
      setShowLoginPopup(true);
      return;
    }
    
    if (!canRedeem(reward.pointsRequired)) {
      // User is logged in but doesn't have enough points - show modal instead of alert
      setInsufficientPointsData({
        rewardName: reward.name,
        pointsNeeded: reward.pointsRequired - userPoints,
        currentPoints: userPoints,
        requiredPoints: reward.pointsRequired
      });
      setShowInsufficientPointsPopup(true);
      return;
    }

    // Set redeeming state for this specific reward
    setRedeeming(prev => ({ ...prev, [reward.id]: true }));

    try {
      // First validate the redemption
      const validation = await rewardsService.validateRedemption(
        reward.id, 
        reward.category, 
        reward.pointsRequired
      );

      if (!validation.success) {
        throw new Error(validation.error || 'Validation failed');
      }

      // Navigate to rewards checkout page with reward data
      navigate('/rewards-checkout', {
        state: {
          itemId: reward.id,
          category: reward.category,
          name: reward.name,
          pointsRequired: reward.pointsRequired,
          image: reward.image,
          quantity: 1,
          size: 'M'
        }
      });
      
    } catch (error) {
      console.error('Redemption validation error:', error);
      
      // Handle redemption error
      const errorMessage = error.message || 'Failed to validate redemption';
      alert(errorMessage);
    } finally {
      // Clear redeeming state
      setRedeeming(prev => ({ ...prev, [reward.id]: false }));
    }
  };

  const handleLogin = () => {
    navigate('/auth/login');
    setShowLoginPopup(false);
  };

  const handleSignup = () => {
    navigate('/auth/signup');
    setShowLoginPopup(false);
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  const closeInsufficientPointsPopup = () => {
    setShowInsufficientPointsPopup(false);
    setInsufficientPointsData(null);
  };

  return (
    <div className="min-h-screen bg-[#ebebeb] py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#190143] mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t('subtitle')}
          </p>
          
          {/* Sign-in message for non-authenticated users */}
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 inline-block">
              <div className="text-center">
                <p className="text-blue-800 font-medium">
                  {i18n.language === 'ar' 
                    ? 'سجل الدخول لبدء كسب واستبدال عملات جيماوي' 
                    : 'Sign in to start earning and redeeming Gymmawy Coins'
                  }
                </p>
              </div>
            </div>
          )}
          
          {/* User Points Display - Only show if authenticated */}
          {isAuthenticated && (
            <div className="bg-white rounded-xl p-6 shadow-lg inline-block">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {i18n.language === 'ar' ? 'عملات جيماوي الخاصة بك' : 'Your Gymmawy Coins'}
                </h3>
                <div className="flex items-center justify-center space-x-3">
                  {getGymmawyCoinIcon({ size: 50 })}
                  <p className="text-3xl font-bold text-[#190143]">{userPoints}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-2 shadow-lg">
            <div className={`flex ${isArabic ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 ${
                      activeCategory === category.key
                        ? 'bg-[#190143] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isArabic ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
                    <span className="text-sm sm:text-base">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8 text-center">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Rewards Grid */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#190143]"></div>
          </div>
        ) : (
          <div>
            {rewards[activeCategory]?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rewards[activeCategory].map((reward) => {
              const canRedeemItem = canRedeem(reward.pointsRequired);
              const isLocked = !isAuthenticated || !canRedeemItem;
              
              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                    isLocked ? 'opacity-75' : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {reward.image ? (
                      <img
                        src={reward.image}
                        alt={reward.name}
                        className="w-full h-full object-cover object-center"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <Gift className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Lock Overlay - Show for all items if not authenticated or insufficient points */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm font-semibold">
                            {!isAuthenticated 
                              ? (isArabic ? 'انضم إلى برنامج المكافآت' : 'Join Our Rewards Program')
                              : (isArabic ? 'عملات غير كافية' : 'Not Enough Coins')
                            }
                          </p>
                          {!isAuthenticated ? (
                            <p className="text-xs">
                              {isArabic 
                                ? 'سجل الدخول إلى حسابك لبدء كسب واستبدال عملات جيماوي للحصول على مكافآت حصرية!'
                                : 'Sign in to your account to start earning and redeeming Gymmawy Coins for exclusive rewards!'
                              }
                            </p>
                          ) : (
                            <p className="text-xs">
                              {isArabic 
                                ? `${reward.pointsRequired - userPoints} نقطة إضافية مطلوبة`
                                : `${reward.pointsRequired - userPoints} more coins needed`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Points Required Badge */}
                    <div className="absolute top-4 right-4 bg-[#190143] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      {reward.pointsRequired} {getGymmawyCoinIcon({ size: 24 })}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#190143] mb-6">
                      {reward.name}
                    </h3>
                    
                    {/* Redeem Button */}
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={redeeming[reward.id]}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${
                        isLocked
                          ? 'bg-gray-400 text-gray-600 cursor-pointer'
                          : redeeming[reward.id]
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-[#190143] text-white hover:bg-[#2a0a5c]'
                      }`}
                    >
                      {redeeming[reward.id] ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('redeeming') || 'Redeeming...'}
                        </div>
                      ) : (
                        isLocked ? t('locked') : t('redeem')
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {t(`${getNoItemsKey(activeCategory)}.title`)}
                </h3>
                <p className="text-gray-500">
                  {t(`${getNoItemsKey(activeCategory)}.description`)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login/Signup Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#190143]">
                {t('loginRequired.title')}
              </h3>
              <button
                onClick={closeLoginPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-8">
              {t('loginRequired.description')}
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full bg-[#190143] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2a0a5c] transition-colors duration-300"
              >
                {t('loginRequired.login')}
              </button>
              
              <button
                onClick={handleSignup}
                className="w-full bg-transparent border-2 border-[#190143] text-[#190143] py-3 px-6 rounded-lg font-semibold hover:bg-[#190143] hover:text-white transition-colors duration-300"
              >
                {t('loginRequired.signup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Points Popup */}
      {showInsufficientPointsPopup && insufficientPointsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#190143]">
                {isArabic ? 'عملات غير كافية' : 'Not Enough Coins'}
              </h3>
              <button
                onClick={closeInsufficientPointsPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center mb-8">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-gray-500" />
              </div>
              
              <p className="text-gray-600 mb-4">
                {isArabic 
                  ? `تحتاج إلى ${insufficientPointsData.pointsNeeded} عملات إضافية لاستبدال "${insufficientPointsData.rewardName}".`
                  : `You need ${insufficientPointsData.pointsNeeded} more points to redeem "${insufficientPointsData.rewardName}".`
                }
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">{t('pointsInfo.currentPoints')}:</span>
                  <span className="font-semibold text-[#190143]">{insufficientPointsData.currentPoints}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">{t('pointsInfo.requiredPoints')}:</span>
                  <span className="font-semibold text-[#190143]">{insufficientPointsData.requiredPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('pointsInfo.pointsNeeded')}:</span>
                  <span className="font-semibold text-red-600">{insufficientPointsData.pointsNeeded}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={closeInsufficientPointsPopup}
                className="w-full bg-[#190143] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2a0a5c] transition-colors duration-300"
              >
                {isArabic ? 'موافق' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
