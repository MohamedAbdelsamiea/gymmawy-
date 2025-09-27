import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import tabbyService from '../../services/tabbyService';
import { useAuth } from '../../contexts/AuthContext';

const TabbyCheckout = ({ 
  orderData, 
  orderType = 'product',
  onSuccess,
  onError,
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (orderData && user) {
      createCheckoutSession();
    }
  }, [orderData, user]);

  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare checkout data
      const checkoutData = tabbyService.createCheckoutData(orderData, orderType);

      // Validate checkout data
      const validation = tabbyService.validateCheckoutData(checkoutData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create checkout session
      const session = await tabbyService.createCheckoutSession(checkoutData);
      setCheckoutSession(session);

      // Redirect to Tabby checkout
      if (session.checkout_session?.checkout_url) {
        window.location.href = session.checkout_session.checkout_url;
      } else {
        throw new Error('No checkout URL received from Tabby');
      }

    } catch (error) {
      console.error('Tabby checkout creation failed:', error);
      setError(error.message);
      showError(`Payment initialization failed: ${error.message}`);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    createCheckoutSession();
  };

  const handleCancel = () => {
    onCancel?.();
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
          Payment Initialization Failed
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          {error}
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (checkoutSession) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
          Redirecting to Payment
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6">
          You will be redirected to Tabby's secure payment page to complete your purchase.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Secure Payment</p>
              <p className="text-xs text-blue-600 mt-1">
                Your payment is processed securely by Tabby. You can pay in installments or full amount.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => window.location.href = checkoutSession.checkout_session.checkout_url}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Payment
        </button>
        
        <button
          onClick={handleCancel}
          className="w-full mt-3 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancel Payment
        </button>
      </div>
    );
  }

  return null;
};

export default TabbyCheckout;
