import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/apiClient';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Tabby redirects with payment_id as per their requirements
    // We also support session_id for backward compatibility
    if (paymentId) {
      verifyPayment(paymentId);
    } else if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError('No payment ID or session ID found in URL');
      setLoading(false);
    }
  }, [paymentId, sessionId]);

  const verifyPayment = async (id) => {
    try {
      setLoading(true);
      
      // Check if this is a Paymob payment (by checking if it starts with 'PAY-' or 'gymmawy_')
      if (id.startsWith('PAY-') || id.startsWith('gymmawy_')) {
        console.log('🔍 Detected Paymob payment, fetching status...');
        await verifyPaymobPayment(id);
        return;
      }
      
      // If the ID starts with 'temp-', we need to find the actual payment record
      let actualId = id;
      if (id.startsWith('temp-')) {
        console.log('🔍 Detected temporary ID, searching for actual payment record...');
        // Search for the most recent payment record for this user
        try {
          const data = await apiClient.get('/payments/recent');
          if (data.payments && data.payments.length > 0) {
            // Find the most recent Tabby payment
            const recentTabbyPayment = data.payments.find(p => p.method === 'TABBY');
            if (recentTabbyPayment && recentTabbyPayment.metadata?.tabby_session_id) {
              actualId = recentTabbyPayment.metadata.tabby_session_id;
              console.log('🔍 Found actual session ID:', actualId);
            }
          }
        } catch (error) {
          console.error('Failed to fetch recent payments:', error);
        }
      }
      
      // Get payment status from Tabby
      const result = await tabbyService.handlePaymentSuccess(actualId);
      
      console.log('🔍 Payment verification result:', result);
      console.log('🔍 Payment status:', result.payment?.status);
      
      // Check if the payment was actually successful
      // Tabby status can be: AUTHORIZED, CLOSED, REJECTED, EXPIRED, CREATED
      const tabbyStatus = result.payment?.status?.toUpperCase();
      
      if (tabbyStatus === 'REJECTED' || tabbyStatus === 'EXPIRED') {
        // Payment was rejected or expired - redirect to failure page
        console.log('❌ Payment was rejected/expired, redirecting to failure page');
        navigate(`/payment/failure?payment_id=${actualId}`, { replace: true });
        return;
      }
      
      if (tabbyStatus === 'CANCELLED') {
        // Payment was cancelled - redirect to cancel page
        console.log('❌ Payment was cancelled, redirecting to cancel page');
        navigate(`/payment/cancel?payment_id=${actualId}`, { replace: true });
        return;
      }
      
      // Payment is successful (AUTHORIZED or CLOSED) or still processing (CREATED)
      if (result.success || tabbyStatus === 'AUTHORIZED' || tabbyStatus === 'CLOSED') {
        setPaymentStatus(result.payment);
        showSuccess('Payment completed successfully!');
      } else {
        setError(result.message);
        showError(result.message);
      }
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
      // Fetch payment status from backend using public endpoint
      const response = await apiClient.get(`/paymob/payment/${paymentReference}/verify`);
      
      if (response.success && response.payment) {
        const payment = response.payment;
        
        console.log('🔍 Paymob payment status:', payment);
        
        // Check payment status
        if (payment.status === 'success') {
          // Use the order reference from backend response (this is the human-readable reference)
          let orderReference = response.order_reference || payment.payment_id;
          let orderType = response.order_type || 'Order';
          
          // Fallback: try to extract from metadata only if backend didn't provide order_reference
          if (!response.order_reference && response.local_metadata) {
            const metadata = response.local_metadata;
            if (metadata.billingData?.subscriptionId) {
              // This is a subscription payment
              orderReference = `SUB-${metadata.billingData.subscriptionId.substring(0, 8).toUpperCase()}`;
              orderType = 'Subscription';
            } else if (metadata.billingData?.programmeId) {
              // This is a programme purchase - use the actual purchase number from backend
              orderReference = `PROG-${metadata.billingData.programmeId.substring(0, 8).toUpperCase()}`;
              orderType = 'Programme';
            }
          }
          
          setPaymentStatus({
            payment_id: orderReference,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            created_at: payment.created_at,
            provider: 'PayMob',
            order_type: orderType
          });
          showSuccess('Payment completed successfully!');
        } else if (payment.status === 'failed') {
          // Redirect to failure page
          navigate(`/payment/failure?payment_id=${paymentReference}&provider=paymob`, { replace: true });
          return;
        } else if (payment.status === 'pending') {
          // Payment is still processing, show pending state
          // Use the order reference from backend response (this is the human-readable reference)
          let orderReference = response.order_reference || payment.payment_id;
          let orderType = response.order_type || 'Order';
          
          // Fallback: try to extract from metadata only if backend didn't provide order_reference
          if (!response.order_reference && response.local_metadata) {
            const metadata = response.local_metadata;
            if (metadata.billingData?.subscriptionId) {
              // This is a subscription payment
              orderReference = `SUB-${metadata.billingData.subscriptionId.substring(0, 8).toUpperCase()}`;
              orderType = 'Subscription';
            } else if (metadata.billingData?.programmeId) {
              // This is a programme purchase - use the actual purchase number from backend
              orderReference = `PROG-${metadata.billingData.programmeId.substring(0, 8).toUpperCase()}`;
              orderType = 'Programme';
            }
          }
          
          setPaymentStatus({
            payment_id: orderReference,
            amount: payment.amount,
            currency: payment.currency,
            status: 'processing',
            created_at: payment.created_at,
            provider: 'PayMob',
            order_type: orderType
          });
          showSuccess('Payment is being processed...');
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

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/dashboard/orders');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h1>
            
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={handleViewOrders}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Check Orders
              </button>
              <button
                onClick={handleContinueShopping}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Payment Successful! 🎉
          </h1>
          
          {/* Order Reference - Critical for Support */}
          {paymentStatus && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {paymentStatus.order_type ? `${paymentStatus.order_type} Reference` : 'Order Reference'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Reference Number:</span>
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border font-semibold text-green-900">
                    {paymentStatus.payment_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid:</span>
                  <span className="font-semibold text-green-900">{paymentStatus.amount} {paymentStatus.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Date & Time:</span>
                  <span className="font-medium text-green-900">{new Date(paymentStatus.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          
          
          {/* Action Buttons */}
          <div className="space-y-3 w-full">
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
              </svg>
              Go to Dashboard
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={handleViewOrders}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Orders
              </button>
              <button
                onClick={handleContinueShopping}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Continue Shopping
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
              Use your reference number above when contacting support. You can always access your order details in your dashboard.
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

export default PaymentSuccess;
