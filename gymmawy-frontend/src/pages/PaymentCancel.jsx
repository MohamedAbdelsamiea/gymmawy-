import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showInfo } = useToast();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Prioritize payment_id as per Tabby requirements, fallback to session_id
    const id = paymentId || sessionId;
    if (id) {
      checkPaymentStatus(id);
    } else {
      setLoading(false);
    }
  }, [paymentId, sessionId]);

  const checkPaymentStatus = async (id) => {
    try {
      setLoading(true);
      
      // Get payment status from Tabby
      const result = await tabbyService.handlePaymentCancel(id);
      setPaymentStatus(result.payment);
      
      // Show cancellation message as per Tabby specification
      showInfo(t('checkout.tabbyCancellation'));
      
    } catch (error) {
      console.error('Payment status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    // Navigate back to checkout page with preserved state
    navigate('/checkout', { 
      state: { 
        fromPaymentCancel: true,
        preserveCart: true
      } 
    });
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            <p className="mt-4 text-gray-600">Checking payment status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Cancel Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Cancel Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            {i18n.language === 'ar' 
              ? 'لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.'
              : 'You aborted the payment. Please retry or choose another payment method.'
            }
          </p>
          
          {/* Payment Details (if available) */}
          {paymentStatus && (
            <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentStatus.payment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{paymentStatus.amount} {paymentStatus.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-yellow-600 capitalize">{paymentStatus.status}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Information Section */}
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">What happened?</h4>
            <p className="text-sm text-blue-800">
              You chose to cancel the payment process. Your items are still in your cart and no charges have been made.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 w-full">
            <button
              onClick={handleRetryPayment}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Try Payment Again
            </button>
            <button
              onClick={handleViewCart}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              View Cart
            </button>
          </div>
          
          <button
            onClick={handleContinueShopping}
            className="w-full mt-3 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
          
          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team for assistance with your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;