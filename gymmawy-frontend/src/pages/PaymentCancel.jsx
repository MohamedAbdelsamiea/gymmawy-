import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';
import apiClient from '../services/apiClient';

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
      
      // Check if this is a Paymob payment
      const provider = searchParams.get('provider') || (id.startsWith('gymmawy_') ? 'paymob' : 'tabby');
      
      if (provider === 'paymob') {
        console.log('🔍 Detected Paymob payment, fetching status...');
        await verifyPaymobPayment(id);
        return;
      }
      
      // Get payment status from Tabby
      const result = await tabbyService.handlePaymentCancel(id);
      
      console.log('🔍 Payment cancel verification result:', result);
      console.log('🔍 Payment status:', result.payment?.status);
      
      // Check if the payment was actually successful or failed (mis-redirected)
      const tabbyStatus = result.payment?.status?.toUpperCase();
      
      if (tabbyStatus === 'AUTHORIZED' || tabbyStatus === 'CLOSED') {
        // Payment was actually successful - redirect to success page
        console.log('✅ Payment was successful, redirecting to success page');
        navigate(`/payment/success?payment_id=${id}`, { replace: true });
        return;
      }
      
      if (tabbyStatus === 'REJECTED' || tabbyStatus === 'EXPIRED') {
        // Payment was rejected/expired - redirect to failure page
        console.log('❌ Payment was rejected/expired, redirecting to failure page');
        navigate(`/payment/failure?payment_id=${id}`, { replace: true });
        return;
      }
      
      setPaymentStatus(result.payment);
      
      // Show cancellation message as per Tabby specification
      showInfo(t('checkout.tabbyCancellation'));
      
    } catch (error) {
      console.error('Payment status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymobPayment = async (paymentReference) => {
    try {
      // Fetch payment status from backend
      const response = await apiClient.get(`/paymob/payments?reference=${paymentReference}`);
      
      if (response.success && response.data.payments.length > 0) {
        const payment = response.data.payments[0];
        
        console.log('🔍 Paymob payment status:', payment);
        
        // Check payment status
        if (payment.status === 'SUCCESS') {
          // Payment was actually successful - redirect to success page
          navigate(`/payment/success?payment_id=${paymentReference}&provider=paymob`, { replace: true });
          return;
        } else if (payment.status === 'FAILED') {
          // Payment failed - redirect to failure page
          navigate(`/payment/failure?payment_id=${paymentReference}&provider=paymob`, { replace: true });
          return;
        } else {
          // Payment was cancelled or is pending
          setPaymentStatus({
            payment_id: payment.transactionId || payment.paymentReference,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status.toLowerCase(),
            created_at: payment.createdAt,
            provider: 'Paymob'
          });
          
          // Show cancellation message
          showInfo('Payment was cancelled. You can try again or choose another payment method.');
        }
      } else {
        throw new Error('Payment not found');
      }
    } catch (error) {
      console.error('Paymob payment verification failed:', error);
      showInfo('Payment was cancelled. You can try again or choose another payment method.');
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">{paymentStatus.provider || 'Tabby'}</span>
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