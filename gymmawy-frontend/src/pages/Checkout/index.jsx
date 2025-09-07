import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Copy, 
  Upload, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Calendar,
  Tag,
  Shield
} from 'lucide-react';

const Checkout = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get plan data from location state
  const { plan, type } = location.state || {};
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: location.pathname, plan, type } 
      });
    }
  }, [isAuthenticated, navigate, location.pathname, plan, type]);

  // Redirect if no plan data
  useEffect(() => {
    if (!plan) {
      navigate('/');
    }
  }, [plan, navigate]);

  // State management
  const [selectedDuration, setSelectedDuration] = useState('normal');
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [paymentOption, setPaymentOption] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to format subscription period
  const formatSubscriptionPeriod = (days) => {
    // Ensure days is a number
    const numDays = parseInt(days) || 0;
    
    // If no days provided, return empty string
    if (numDays === 0) return '';
    
    // Check if it's a clean week division (like 42 days = 6 weeks)
    if (numDays >= 7 && numDays % 7 === 0) {
      const weeks = numDays / 7;
      return t('common.weeks', { count: weeks });
    }
    // Check if it's a clean month division (like 30, 60, 90 days)
    else if (numDays >= 30 && numDays % 30 === 0) {
      const months = numDays / 30;
      return t('common.months', { count: months });
    }
    // For other cases, show days
    else {
      return t('common.days', { count: numDays });
    }
  };

  // Helper function to format gift period
  const formatGiftPeriod = (days) => {
    if (days === 0) return '';
    return ` + ${formatSubscriptionPeriod(days)}`;
  };

  // Helper function to parse duration from static data (e.g., "6 Weeks + 6 Weeks")
  const parseDurationFromStatic = (duration) => {
    if (!duration) return { subscriptionDays: 0, giftDays: 0 };
    
    // Split by " + " to separate main and gift periods
    const parts = duration.split(' + ');
    const mainPeriod = parts[0] || '';
    const giftPeriod = parts[1] || '';
    
    // Parse main period
    const mainMatch = mainPeriod.match(/(\d+)\s*(weeks?|months?|days?)/i);
    let subscriptionDays = 0;
    if (mainMatch) {
      const value = parseInt(mainMatch[1]);
      const unit = mainMatch[2].toLowerCase();
      if (unit.startsWith('week')) {
        subscriptionDays = value * 7;
      } else if (unit.startsWith('month')) {
        subscriptionDays = value * 30;
      } else if (unit.startsWith('day')) {
        subscriptionDays = value;
      }
    }
    
    // Parse gift period
    const giftMatch = giftPeriod.match(/(\d+)\s*(weeks?|months?|days?)/i);
    let giftDays = 0;
    if (giftMatch) {
      const value = parseInt(giftMatch[1]);
      const unit = giftMatch[2].toLowerCase();
      if (unit.startsWith('week')) {
        giftDays = value * 7;
      } else if (unit.startsWith('month')) {
        giftDays = value * 30;
      } else if (unit.startsWith('day')) {
        giftDays = value;
      }
    }
    
    return { subscriptionDays, giftDays };
  };

  // Helper function to parse price from static data (e.g., "1999 L.E")
  const parsePriceFromStatic = (priceString) => {
    if (!priceString) return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    
    // Extract amount and currency symbol
    const match = priceString.match(/(\d+(?:\.\d+)?)\s*(.+)/);
    if (match) {
      const amount = parseFloat(match[1]);
      const currencySymbol = match[2].trim();
      return {
        amount,
        currency: currencySymbol === 'L.E' ? 'EGP' : 'EGP',
        currencySymbol
      };
    }
    
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Debug: Log plan data to see what we're receiving (can be removed in production)
  console.log('=== CHECKOUT DEBUG ===');
  console.log('Plan object:', plan);
  console.log('Plan subscriptionPeriodDays:', plan?.subscriptionPeriodDays);
  console.log('Plan giftPeriodDays:', plan?.giftPeriodDays);
  console.log('Plan subscriptionPeriod:', plan?.subscriptionPeriod);
  console.log('Plan giftPeriod:', plan?.giftPeriod);
  console.log('Plan price:', plan?.price);
  console.log('Plan priceEGP:', plan?.priceEGP);
  console.log('Plan priceSAR:', plan?.priceSAR);
  console.log('Plan medicalEGP:', plan?.medicalEGP);
  console.log('Plan medicalSAR:', plan?.medicalSAR);
  console.log('Plan discountPercentage:', plan?.discountPercentage);
  console.log('Plan keys:', plan ? Object.keys(plan) : 'No plan');
  console.log('====================');

  // Get duration data - handle both API and static data
  const getDurationData = () => {
    if (!plan) {
      return { subscriptionDays: 0, giftDays: 0 };
    }
    
    // Check for API data format with different possible field names
    if (plan.subscriptionPeriodDays !== undefined) {
      return {
        subscriptionDays: plan.subscriptionPeriodDays || 0,
        giftDays: plan.giftPeriodDays || 0
      };
    } else if (plan.subscriptionPeriod !== undefined) {
      // Alternative API field names
      return {
        subscriptionDays: plan.subscriptionPeriod || 0,
        giftDays: plan.giftPeriod || 0
      };
    } else if (plan.duration) {
      // Static data format - parse from duration string
      return parseDurationFromStatic(plan.duration);
    }
    
    // If we have a plan but no duration data, try to infer from plan name
    if (plan.name) {
      const planName = typeof plan.name === 'string' ? plan.name : (plan.name.en || plan.name.ar || '');
      const nameLower = planName.toLowerCase();
      
      // Try to extract duration from plan name
      if (nameLower.includes('6 weeks') || nameLower.includes('6 أسابيع')) {
        return { subscriptionDays: 42, giftDays: 42 }; // 6 weeks + 6 weeks
      } else if (nameLower.includes('6 months') || nameLower.includes('6 أشهر')) {
        return { subscriptionDays: 180, giftDays: 180 }; // 6 months + 6 months
      } else if (nameLower.includes('3 months') || nameLower.includes('3 أشهر')) {
        return { subscriptionDays: 90, giftDays: 90 }; // 3 months + 3 months
      } else if (nameLower.includes('12 months') || nameLower.includes('12 شهر')) {
        return { subscriptionDays: 360, giftDays: 360 }; // 12 months + 12 months
      }
    }
    
    return { subscriptionDays: 0, giftDays: 0 };
  };

  const durationData = getDurationData();
  
  // Debug: Log duration data (can be removed in production)
  // console.log('=== DURATION DEBUG ===');
  // console.log('Duration data:', durationData);
  // console.log('Subscription days:', durationData.subscriptionDays);
  // console.log('Gift days:', durationData.giftDays);
  // console.log('====================');

  // Helper function to convert Prisma Decimal to number
  const convertDecimalToNumber = (decimalField) => {
    console.log('=== DECIMAL CONVERSION DEBUG ===');
    console.log('Input decimalField:', decimalField);
    console.log('Type:', typeof decimalField);
    
    if (!decimalField) {
      console.log('No decimalField, returning 0');
      return 0;
    }
    
    if (typeof decimalField === 'number') {
      console.log('Number type, returning:', decimalField);
      return decimalField;
    }
    
    if (typeof decimalField === 'string') {
      console.log('String type, parsing:', decimalField);
      return parseFloat(decimalField);
    }
    
    if (decimalField.s !== undefined && decimalField.e !== undefined && decimalField.d !== undefined) {
      // Handle Prisma Decimal object: {s: 1, e: 3, d: [3300]}
      // s = sign (1 for positive, -1 for negative)
      // e = exponent (number of digits after decimal point)
      // d = digits array
      const sign = decimalField.s === 1 ? 1 : -1;
      const exponent = decimalField.e;
      const digits = decimalField.d;
      const digitsStr = digits.join('');
      
      console.log('Prisma Decimal object detected');
      console.log('Sign:', sign, 'Exponent:', exponent, 'Digits:', digits, 'DigitsStr:', digitsStr);
      
      // For e=3 and d=[3300], the value is 3300 (not 3.300)
      // Prisma Decimal stores the value as-is when e equals the number of digits
      // So 3300 with e=3 means 3300, not 3.300
      const amount = parseFloat(digitsStr);
      const finalResult = amount * sign;
      
      console.log('Parsed amount:', amount, 'Final result:', finalResult);
      console.log('================================');
      return finalResult;
    }
    
    if (decimalField.toString) {
      console.log('Has toString method, using it as fallback');
      const result = parseFloat(decimalField.toString());
      console.log('toString result:', result);
      return result;
    }
    
    console.log('No matching condition, returning 0');
    console.log('================================');
    return 0;
  };

  // Get normal price (static)
  const getNormalPrice = () => {
    if (!plan) return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    
    console.log('=== NORMAL PRICE DEBUG ===');
    console.log('plan.price:', plan.price);
    console.log('plan.priceEGP:', plan.priceEGP);
    console.log('plan.priceSAR:', plan.priceSAR);
    
    if (plan.price?.amount !== undefined && plan.price?.amount !== null && plan.price?.amount > 0) {
      console.log('Using plan.price:', plan.price);
      return plan.price;
    }
    
    const priceField = plan.priceEGP || plan.priceSAR;
    console.log('Selected priceField:', priceField);
    
    if (priceField) {
      const amount = convertDecimalToNumber(priceField);
      console.log('Converted amount:', amount);
      return {
        amount: amount,
        currency: 'EGP',
        currencySymbol: 'L.E'
      };
    }
    
    console.log('Returning fallback price');
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Get medical price (static)
  const getMedicalPrice = () => {
    if (!plan) return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    
    console.log('=== MEDICAL PRICE DEBUG ===');
    console.log('plan.medicalPrice:', plan.medicalPrice);
    console.log('plan.medicalEGP:', plan.medicalEGP);
    console.log('plan.medicalSAR:', plan.medicalSAR);
    
    if (plan.medicalPrice?.amount !== undefined && plan.medicalPrice?.amount !== null && plan.medicalPrice?.amount > 0) {
      console.log('Using plan.medicalPrice:', plan.medicalPrice);
      return plan.medicalPrice;
    }
    
    const priceField = plan.medicalEGP || plan.medicalSAR || plan.priceEGP || plan.priceSAR;
    console.log('Selected medical priceField:', priceField);
    
    if (priceField) {
      const amount = convertDecimalToNumber(priceField);
      console.log('Converted medical amount:', amount);
      return {
        amount: amount,
        currency: 'EGP',
        currencySymbol: 'L.E'
      };
    }
    
    console.log('Returning fallback medical price');
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Calculate pricing based on selected duration
  const getPrice = () => {
    if (type === 'subscription') {
      return selectedDuration === 'medical' ? getMedicalPrice() : getNormalPrice();
    }
    
    // For programmes
    if (type === 'programme') {
      return getProgrammePrice();
    }
    
    // For other types or fallback
    if (typeof plan.price === 'string') {
      return parsePriceFromStatic(plan.price);
    }
    return plan.price || { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Get programme price
  const getProgrammePrice = () => {
    if (!plan) return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    
    // Handle structured price object
    if (plan.price && typeof plan.price === 'object') {
      return {
        amount: plan.price.amount || 0,
        currency: plan.price.currency || 'EGP',
        currencySymbol: plan.price.currencySymbol || 'L.E'
      };
    }
    
    // Handle raw price fields
    if (plan.priceEGP !== undefined) {
      const amount = convertDecimalToNumber(plan.priceEGP);
      return { amount, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    if (plan.priceSAR !== undefined) {
      const amount = convertDecimalToNumber(plan.priceSAR);
      return { amount, currency: 'SAR', currencySymbol: 'S.R' };
    }
    
    // Handle string price
    if (typeof plan.price === 'string') {
      if (plan.price === 'FREE' || plan.price === 'مجاني') {
        return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
      }
      return parsePriceFromStatic(plan.price);
    }
    
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  const currentPrice = getPrice();
  
  // Debug: Log price calculation
  console.log('=== PRICE DEBUG ===');
  console.log('Current price:', currentPrice);
  console.log('Price amount:', currentPrice?.amount);
  console.log('Price currency:', currentPrice?.currency);
  console.log('Price currencySymbol:', currentPrice?.currencySymbol);
  console.log('==================');
  
  // Calculate discount from plan data and coupon
  const getDiscount = () => {
    let discount = 0;
    
    // Check for plan-level discount percentage (subscriptions and programmes)
    if (plan?.discountPercentage && plan.discountPercentage > 0) {
      const planDiscount = (currentPrice?.amount || 0) * (plan.discountPercentage / 100);
      discount += planDiscount;
    }
    
    // Check for coupon discount (if coupon is valid)
    if (couponValid && couponCode.trim()) {
      // TODO: Calculate coupon discount from API response
      // For now, simulate a 10% coupon discount
      const couponDiscount = (currentPrice?.amount || 0) * 0.1;
      discount += couponDiscount;
    }
    
    return discount;
  };
  
  const discount = getDiscount();
  const subtotal = currentPrice?.amount || 0;
  const total = subtotal - discount;
  
  // Debug: Log discount calculation
  console.log('=== DISCOUNT DEBUG ===');
  console.log('Plan discount percentage:', plan?.discountPercentage);
  console.log('Plan keys with discount:', Object.keys(plan || {}).filter(key => key.toLowerCase().includes('discount')));
  console.log('Coupon valid:', couponValid);
  console.log('Coupon code:', couponCode);
  console.log('Calculated discount:', discount);
  console.log('Subtotal:', subtotal);
  console.log('Total after discount:', total);
  console.log('========================');

  // Handle coupon validation
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    try {
      // TODO: Implement coupon validation API call
      // For now, simulate validation
      setTimeout(() => {
        setCouponValid(couponCode.toLowerCase() === 'test10');
        setCouponLoading(false);
      }, 1000);
    } catch (error) {
      setCouponValid(false);
      setCouponLoading(false);
    }
  };

  // Handle payment proof upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setPaymentProof(file);
    }
  };

  // Handle copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (type === 'subscription') {
        // Calculate current price and discount
        const currentPrice = getPrice();
        const discount = getDiscount();
        const isMedical = selectedDuration === 'medical';
        
        // Calculate total discount amount and percentage
        const totalDiscountAmount = getDiscount();
        const totalDiscountPercentage = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;
        const finalAmount = total; // This is the discounted amount
        
        // Create subscription with complete data
        const subscriptionData = {
          planId: plan.id,
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONECASH' : paymentOption?.toUpperCase(),
          paymentProof: paymentProof ? URL.createObjectURL(paymentProof) : undefined,
          // Additional subscription details
          medical: isMedical,
          price: finalAmount, // Use the final discounted amount
          currency: currentPrice?.currency || 'EGP',
          discount: Math.round(totalDiscountPercentage), // Total discount percentage including coupon
          // Duration information
          subscriptionPeriodDays: durationData.subscriptionDays,
          giftPeriodDays: durationData.giftDays,
          // Plan details for reference
          planName: plan.name,
          planDescription: plan.description,
          // Additional discount details
          planDiscountPercentage: plan?.discountPercentage || 0,
          couponDiscountPercentage: couponValid && couponCode.trim() ? 10 : 0, // Coupon discount
          totalDiscountAmount: totalDiscountAmount,
          originalPrice: subtotal
        };

        console.log('Creating subscription with complete data:', subscriptionData);

        const response = await fetch('http://localhost:3000/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(subscriptionData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to create subscription');
        }

        const result = await response.json();
        console.log('Subscription created:', result);
      } else if (type === 'programme') {
        // Handle programme purchase
        const currentPrice = getPrice();
        const discount = getDiscount();
        const finalAmount = total; // This is the discounted amount
        
        // Create programme purchase data
        const programmeData = {
          programmeId: plan.id,
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONECASH' : paymentOption?.toUpperCase(),
          paymentProof: paymentProof ? URL.createObjectURL(paymentProof) : undefined,
          price: finalAmount, // Use the final discounted amount
          currency: currentPrice?.currency || 'EGP',
          discount: Math.round((discount / subtotal) * 100), // Total discount percentage
          programmeName: plan.name,
          programmeDescription: plan.description,
          originalPrice: subtotal,
          discountAmount: discount
        };

        console.log('Creating programme purchase with data:', programmeData);

        // Call programme purchase API
        const response = await fetch(`http://localhost:3000/api/programmes/${plan.id}/purchase-with-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(programmeData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to purchase programme');
        }

        const result = await response.json();
        console.log('Programme purchased:', result);
      } else {
        console.log('Other order type submitted:', { plan, type, paymentOption, paymentProof });
      }

        setSuccess(true);
        setSubmitting(false);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been submitted. We'll contact you soon to confirm payment and start your {type}.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gymmawy-primary text-white py-2 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Duration Selection (for subscriptions) */}
              {type === 'subscription' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gymmawy-primary" />
                    Choose Duration
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="duration"
                        value="normal"
                        checked={selectedDuration === 'normal'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {durationData.subscriptionDays > 0 ? (
                              <>
                                {formatSubscriptionPeriod(durationData.subscriptionDays)}
                                {formatGiftPeriod(durationData.giftDays)}
                              </>
                            ) : (
                              <span className="text-gray-500">Duration not specified</span>
                            )}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {getNormalPrice()?.currencySymbol} {getNormalPrice()?.amount || 0}
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="duration"
                        value="medical"
                        checked={selectedDuration === 'medical'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {durationData.subscriptionDays > 0 ? (
                              <>
                                {formatSubscriptionPeriod(durationData.subscriptionDays)}
                                {formatGiftPeriod(durationData.giftDays)} - {i18n.language === 'ar' ? 'باقة طبية - اذا كان عندك اصابة او مرض مزمن' : 'Medical Package - If you have an injury or chronic condition'}
                              </>
                            ) : (
                              <span className="text-gray-500">Duration not specified - {i18n.language === 'ar' ? 'باقة طبية - اذا كان عندك اصابة او مرض مزمن' : 'Medical Package - If you have an injury or chronic condition'}</span>
                            )}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {getMedicalPrice()?.currencySymbol} {getMedicalPrice()?.amount || 0}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Programme Details (for programmes) */}
              {type === 'programme' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-gymmawy-primary" />
                    Programme Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {plan.image && (
                        <img 
                          src={plan.image} 
                          alt={plan.name} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                        {plan.description && (
                          <p className="text-gray-600 text-sm">{plan.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Programme Type</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Training Programme
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-gymmawy-primary" />
                  Coupon Code
                </h3>
                
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? 'Validating...' : 'Apply'}
                  </button>
                </div>
                
                {couponValid !== null && (
                  <div className={`mt-3 flex items-center text-sm ${
                    couponValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {couponValid ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {couponValid ? 'Coupon applied successfully!' : 'Invalid coupon code'}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-gymmawy-primary" />
                  Payment Method
                </h3>
                
                {/* Payment Type Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="full"
                        checked={paymentMethod === 'full'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Pay Full Amount</span>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="installments"
                        checked={paymentMethod === 'installments'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Pay in Installments</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Options */}
                {paymentMethod === 'full' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Choose Payment Option:</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="instapay"
                          checked={paymentOption === 'instapay'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className="ml-3 flex items-center">
                          <img src="/assets/common/payments/insta-pay.png" alt="InstaPay" className="h-8 w-8 mr-2" />
                          <span className="text-sm font-medium text-gray-900">InstaPay</span>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="vodafone"
                          checked={paymentOption === 'vodafone'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className="ml-3 flex items-center">
                          <img src="/assets/common/payments/vodafone-cash.png" alt="Vodafone Cash" className="h-8 w-8 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Vodafone Cash</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {paymentMethod === 'installments' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Choose Installment Provider:</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="tabby"
                          checked={paymentOption === 'tabby'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className="ml-3 flex items-center">
                          <img src="/assets/common/payments/tabby.png" alt="Tabby" className="h-8 w-8 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Tabby</span>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="tamara"
                          checked={paymentOption === 'tamara'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className="ml-3 flex items-center">
                          <img src="/assets/common/payments/tamara.png" alt="Tamara" className="h-8 w-8 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Tamara</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Payment Instructions */}
                {paymentOption === 'instapay' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">Insta Pay</h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>rawdakhairy@instapay</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('rawdakhairy@instapay')}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          COPY
                        </button>
                      </div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Transfer to rawdakhairy@instapay</li>
                        <li>After the transfer, attach a picture of the transfer</li>
                        <li>You will be contacted as soon as possible to confirm the transfer and start the subscription</li>
                      </ol>
                    </div>
                  </div>
                )}

                {paymentOption === 'vodafone' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-3">Vodafone Cash</h5>
                    <div className="space-y-2 text-sm text-red-800">
                      <div className="flex items-center justify-between">
                        <span>01060599054 - 01014454237</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('01060599054 - 01014454237')}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          COPY
                        </button>
                      </div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Transfer to 01060599054 and 01014454237</li>
                        <li>After the transfer, attach a picture of the transfer</li>
                        <li>You will be contacted as soon as possible to confirm the transfer and start the subscription</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Payment Proof Upload */}
                {(paymentOption === 'instapay' || paymentOption === 'vodafone') && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Proof (Screenshot of Transfer)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload a clear screenshot of your payment transfer. Max file size: 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="payment-proof"
                      />
                      <label
                        htmlFor="payment-proof"
                        className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Choose Image File</span>
                          <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>
                        </div>
                      </label>
                      
                      {paymentProof && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <img 
                                  src={URL.createObjectURL(paymentProof)} 
                                  alt="Payment proof preview" 
                                  className="w-10 h-10 object-cover rounded"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{paymentProof.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPaymentProof(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tabby/Tamara Placeholder */}
                {(paymentOption === 'tabby' || paymentOption === 'tamara') && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      {paymentOption === 'tabby' ? 'Tabby' : 'Tamara'} integration coming soon. 
                      Your order will be processed automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !paymentOption}
                  className="px-8 py-3 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{plan.name}</h4>
                    {plan?.discountPercentage && plan.discountPercentage > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {plan.discountPercentage}% OFF
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>

                {/* Benefits section - only show for subscriptions */}
                {type === 'subscription' && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Benefits:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.benefits?.map((benefit, index) => {
                      const benefitDescription = typeof benefit === 'string' ? benefit : 
                        (benefit.benefit?.description ? 
                          (typeof benefit.benefit.description === 'string' ? benefit.benefit.description : 
                            (benefit.benefit.description?.en || benefit.benefit.description?.ar || '')) : '');
                      return (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {benefitDescription}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{currentPrice?.currencySymbol} {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 ? (
                    <div className="space-y-2">
                      {/* Plan discount */}
                      {plan?.discountPercentage && plan.discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                          <span>Plan Discount ({plan.discountPercentage}%):</span>
                          <span>-{currentPrice?.currencySymbol} {((currentPrice?.amount || 0) * (plan.discountPercentage / 100)).toFixed(2)}</span>
                    </div>
                  )}
                      
                      {/* Coupon discount */}
                      {couponValid && couponCode.trim() && (
                    <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon Discount ({couponCode}):</span>
                          <span>-{currentPrice?.currencySymbol} {((currentPrice?.amount || 0) * 0.1).toFixed(2)}</span>
                        </div>
                      )}
                      
                      
                      {/* Total discount */}
                      <div className="flex justify-between text-sm font-medium text-green-600 border-t border-green-200 pt-1">
                        <span>Total Discount:</span>
                        <span>-{currentPrice?.currencySymbol} {discount.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{currentPrice?.currencySymbol} {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
