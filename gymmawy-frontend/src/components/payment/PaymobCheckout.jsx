import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import paymobService from '../../services/paymobService.js';
import { useAuth } from '../../hooks/useAuth';
import { useCurrencyContext } from '../../contexts/CurrencyContext.jsx';
import './PaymobCheckout.css';

const PaymobCheckout = ({ 
  amount, 
  currency, 
  items = [], 
  orderId, 
  subscriptionPlanId, 
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrencyContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (paymentMethod = 'card') => {
    try {
      setLoading(true);
      setError(null);

      // Validate user data
      if (!user) {
        throw new Error('User must be logged in to make payments');
      }

      // Prepare payment data
      const paymentData = paymobService.formatPaymentData({
        amount: amount,
        currency: currency || currentCurrency,
        paymentMethod: paymentMethod,
        items: items,
        billingData: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          phoneNumber: user.mobileNumber || '',
          street: user.street || '',
          building: user.building || '',
          apartment: '',
          floor: '',
          city: user.city || '',
          state: '',
          country: user.country || 'KSA',
          postalCode: user.postcode || ''
        },
        customer: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          extras: {
            userId: user.id,
            userRole: user.role
          }
        },
        extras: {
          source: 'web',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        orderId: orderId,
        subscriptionPlanId: subscriptionPlanId
      });

      // Validate payment data
      const validation = paymobService.validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create intention and open checkout
      const result = await paymobService.createAndPay(paymentData);

      if (result.success) {
        // Open checkout URL in a new window
        const checkoutWindow = window.open(
          result.checkoutUrl,
          'paymob_checkout',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (!checkoutWindow) {
          throw new Error('Failed to open checkout window. Please check your popup blocker settings.');
        }

        onSuccess && onSuccess(result);
      } else {
        throw new Error('Payment failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = () => handlePayment('card');
  const handleApplePay = () => handlePayment('apple_pay');

  return (
    <div className="paymob-checkout">
      <div className="paymob-checkout__header">
        <h3>{t('payment.paymob.title', 'Pay with Paymob')}</h3>
        <p className="paymob-checkout__subtitle">
          {t('payment.paymob.subtitle', 'Secure payment powered by Paymob')}
        </p>
      </div>

      <div className="paymob-checkout__amount">
        <div className="amount-display">
          <span className="amount-label">{t('payment.amount', 'Amount')}:</span>
          <span className="amount-value">
            {amount} {currency || currentCurrency}
          </span>
        </div>
      </div>

      {error && (
        <div className="paymob-checkout__error">
          <p>{error}</p>
        </div>
      )}

      <div className="paymob-checkout__methods">
        <button
          className="paymob-checkout__button paymob-checkout__button--card"
          onClick={handleCardPayment}
          disabled={loading}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              {t('payment.paymob.payWithCard', 'Pay with Card')}
            </>
          )}
        </button>

        <button
          className="paymob-checkout__button paymob-checkout__button--apple"
          onClick={handleApplePay}
          disabled={loading}
        >
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <svg className="apple-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {t('payment.paymob.payWithApple', 'Pay with Apple Pay')}
            </>
          )}
        </button>
      </div>

      <div className="paymob-checkout__security">
        <div className="security-badges">
          <span className="security-badge">
            <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {t('payment.secure', 'Secure')}
          </span>
          <span className="security-badge">
            <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t('payment.encrypted', 'Encrypted')}
          </span>
        </div>
        <p className="paymob-checkout__disclaimer">
          {t('payment.paymob.disclaimer', 'Your payment information is secure and encrypted. We do not store your card details.')}
        </p>
      </div>

      {onCancel && (
        <button
          className="paymob-checkout__cancel"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel', 'Cancel')}
        </button>
      )}
    </div>
  );
};

export default PaymobCheckout;
