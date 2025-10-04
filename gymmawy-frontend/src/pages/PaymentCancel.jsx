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
          
          <p className="text-gray-600 mb-4">
            {i18n.language === 'ar' 
              ? 'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى في أي وقت.'
              : 'You cancelled your payment. No worries - you can try again anytime.'
            }
          </p>
          
          {/* Order Preservation Notice */}
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-blue-900">Your Order is Saved</h3>
            </div>
            <p className="text-sm text-blue-800">
              Your order has been preserved in your cart. You can resume payment anytime from your dashboard or cart.
            </p>
          </div>
          
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
          <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happened?
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>You chose to cancel the payment process</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Your items are safely saved in your cart</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>No charges have been made to your card</span>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Resume Payment
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={handleViewCart}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                View Cart
              </button>
              <button
                onClick={handleContinueShopping}
                className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Return to Store
              </button>
            </div>
          </div>
          
          {/* Support Section */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
              Need Help?
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              If you didn't mean to cancel or need assistance with your payment, our support team is here to help.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;