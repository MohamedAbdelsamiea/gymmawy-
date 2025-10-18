import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const { showError } = useToast();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const sessionId = searchParams.get('session_id');
  const reason = searchParams.get('reason');

  useEffect(() => {
    // Prioritize payment_id as per Tabby requirements, fallback to session_id
    const id = paymentId || sessionId;
    if (id) {
      verifyPayment(id);
    } else {
      setError('No payment ID found in URL');
      setLoading(false);
    }
  }, [paymentId, sessionId]);

  const verifyPayment = async (id) => {
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
      const result = await tabbyService.handlePaymentFailure(id);
      
      console.log('🔍 Payment failure verification result:', result);
      console.log('🔍 Payment status:', result.payment?.status);
      
      // Check if the payment was actually successful (mis-redirected)
      const tabbyStatus = result.payment?.status?.toUpperCase();
      
      if (tabbyStatus === 'AUTHORIZED' || tabbyStatus === 'CLOSED') {
        // Payment was actually successful - redirect to success page
        console.log('✅ Payment was successful, redirecting to success page');
        navigate(`/payment/success?payment_id=${id}`, { replace: true });
        return;
      }
      
      if (tabbyStatus === 'CANCELLED') {
        // Payment was cancelled - redirect to cancel page
        console.log('❌ Payment was cancelled, redirecting to cancel page');
        navigate(`/payment/cancel?payment_id=${id}`, { replace: true });
        return;
      }
      
      setPaymentStatus(result.payment);
      
      // Show failure message as per Tabby specification
      showError(t('checkout.tabbyFailure'));
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      setError(error.message);
      showError('Failed to verify payment status');
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
          setPaymentStatus({
            payment_id: payment.transactionId || payment.paymentReference,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status.toLowerCase(),
            created_at: payment.processedAt || payment.createdAt,
            provider: 'Paymob'
          });
          
          // Show failure message
          showError('Payment was declined. Please try again with a different payment method.');
        } else if (payment.status === 'PENDING') {
          // Payment is still processing, redirect to success page
          navigate(`/payment/success?payment_id=${paymentReference}&provider=paymob`, { replace: true });
          return;
        }
      } else {
        throw new Error('Payment not found');
      }
    } catch (error) {
      console.error('Paymob payment verification failed:', error);
      setError('Failed to verify payment status');
      showError('Failed to verify payment status');
    }
  };

  const handleRetryPayment = () => {
    // Get the original purchase data from sessionStorage
    const originalPurchaseData = sessionStorage.getItem('originalPurchaseData');
    let purchaseData = {};
    
    if (originalPurchaseData) {
      try {
        purchaseData = JSON.parse(originalPurchaseData);
      } catch (error) {
        console.error('Error parsing original purchase data:', error);
      }
    }
    
    // Navigate back to checkout page with preserved state
    // This ensures cart items are preserved and Tabby remains available
    navigate('/checkout', { 
      state: { 
        fromPaymentFailure: true,
        paymentFailureReason: reason || 'rejected',
        preserveCart: true,
        ...purchaseData // Include original purchase data
      } 
    });
  };

  const handleContactSupport = () => {
    // Navigate to support page or open contact form
    navigate('/contact');
  };

  const handleContinueShopping = () => {
    navigate('/store');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
          {/* Failure Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          {/* Failure Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed ❌
          </h1>
          
          <p className="text-gray-600 mb-4">
            {reason === 'rejected' 
              ? (i18n.language === 'ar' 
                  ? 'نأسف، لم نتمكن من معالجة الدفعة. يرجى المحاولة مرة أخرى.'
                  : 'Sorry, we couldn\'t process your payment. Please try again.')
              : reason === 'expired'
              ? (i18n.language === 'ar'
                  ? 'انتهت صلاحية جلسة الدفع. يرجى المحاولة مرة أخرى.'
                  : 'Your payment session has expired. Please try again.')
              : (i18n.language === 'ar'
                  ? 'نأسف، لم نتمكن من معالجة الدفعة. يرجى المحاولة مرة أخرى.'
                  : 'Sorry, we couldn\'t process your payment. Please try again.')
            }
          </p>
          
          {/* Reassurance */}
          <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-green-900">No Charges Made</h3>
            </div>
            <p className="text-sm text-green-800">
              Your card has not been charged. You can safely try again with the same or different payment method.
            </p>
          </div>
          
          {/* Payment Details */}
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
                  <span className="font-medium text-red-600 capitalize">{paymentStatus.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">{paymentStatus.provider || 'Tabby'}</span>
                </div>
                {paymentStatus.tabby_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tabby Status:</span>
                    <span className="font-medium text-red-600">{paymentStatus.tabby_status}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Common Reasons & Solutions */}
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Common Reasons & Solutions
            </h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Check that you have sufficient funds available</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Verify your card details are correct</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Try a different payment method or card</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Contact support if the problem persists</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 w-full">
            <button
              onClick={handleRetryPayment}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={handleContactSupport}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </button>
              <button
                onClick={handleContinueShopping}
                className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
