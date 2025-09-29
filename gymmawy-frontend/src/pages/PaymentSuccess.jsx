import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';
import { useAuth } from '../contexts/AuthContext';

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
      
      // If the ID starts with 'temp-', we need to find the actual payment record
      let actualId = id;
      if (id.startsWith('temp-')) {
        console.log('🔍 Detected temporary ID, searching for actual payment record...');
        // Search for the most recent payment record for this user
        const response = await fetch('/payments/recent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.payments && data.payments.length > 0) {
            // Find the most recent Tabby payment
            const recentTabbyPayment = data.payments.find(p => p.method === 'TABBY');
            if (recentTabbyPayment && recentTabbyPayment.metadata?.tabby_session_id) {
              actualId = recentTabbyPayment.metadata.tabby_session_id;
              console.log('🔍 Found actual session ID:', actualId);
            }
          }
        }
      }
      
      // Get payment status from Tabby
      const result = await tabbyService.handlePaymentSuccess(actualId);
      
      if (result.success) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
          
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
                  <span className="font-medium text-green-600 capitalize">{paymentStatus.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(paymentStatus.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Next Steps */}
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Your order is being processed</li>
              <li>• You can track your order in your dashboard</li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 w-full">
            <div className="flex space-x-3">
              <button
                onClick={handleViewOrders}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                View Orders
              </button>
              <button
                onClick={handleGoToDashboard}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Dashboard
              </button>
            </div>
            <button
              onClick={handleContinueShopping}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
          
          {/* Navigation notice */}
          <p className="text-xs text-gray-500 mt-4">
            Use the buttons above to navigate to your orders or continue shopping.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
