import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import tabbyService from '../services/tabbyService';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (paymentId) {
      verifyPayment();
    } else {
      setError('No payment ID found in URL');
      setLoading(false);
    }
  }, [paymentId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      
      // Get payment status from Tabby
      const result = await tabbyService.handlePaymentFailure(paymentId);
      
      setPaymentStatus(result.payment);
      showError(result.message);
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      setError(error.message);
      showError('Failed to verify payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    // Navigate back to checkout or payment page
    navigate(-2); // Go back 2 steps to checkout page
  };

  const handleContactSupport = () => {
    // Navigate to support page or open contact form
    navigate('/contact');
  };

  const handleContinueShopping = () => {
    navigate('/');
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
            Payment Failed
          </h1>
          
          <p className="text-gray-600 mb-6">
            {reason === 'rejected' 
              ? 'Your payment was rejected. This could be due to insufficient funds or other payment issues.'
              : reason === 'expired'
              ? 'Your payment session has expired. Please try again with a new payment session.'
              : 'Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.'
            }
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
                  <span className="font-medium text-red-600 capitalize">{paymentStatus.status}</span>
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
          
          {/* Help Section */}
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-900 mb-2">Need Help?</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Check your payment method details</li>
              <li>• Ensure sufficient funds are available</li>
              <li>• Try a different payment method</li>
              <li>• Contact our support team for assistance</li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 w-full">
            <button
              onClick={handleRetryPayment}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={handleContactSupport}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Contact Support
            </button>
          </div>
          
          <button
            onClick={handleContinueShopping}
            className="w-full mt-3 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
