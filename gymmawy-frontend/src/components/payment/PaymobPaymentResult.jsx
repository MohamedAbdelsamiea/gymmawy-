import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import paymobService from '../../services/paymobService.js';
import './PaymobPaymentResult.css';

const PaymobPaymentResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        setLoading(true);

        // Get parameters from URL
        const intentionId = searchParams.get('intention_id');
        const status = searchParams.get('status');
        const transactionId = searchParams.get('transaction_id');
        const success = searchParams.get('success') === 'true';
        const errorMessage = searchParams.get('error');

        if (errorMessage) {
          setResult({
            success: false,
            error: errorMessage,
            intentionId,
            transactionId
          });
          return;
        }

        if (intentionId) {
          // Get the latest status from the API
          try {
            const statusResult = await paymobService.getIntentionStatus(intentionId);
            setResult({
              success: success,
              status: status,
              intentionId: intentionId,
              transactionId: transactionId,
              data: statusResult.data
            });
          } catch (apiError) {
            console.warn('Failed to fetch intention status:', apiError);
            // Fallback to URL parameters
            setResult({
              success: success,
              status: status,
              intentionId: intentionId,
              transactionId: transactionId
            });
          }
        } else {
          setResult({
            success: success,
            status: status,
            transactionId: transactionId
          });
        }

      } catch (error) {
        console.error('Error processing payment result:', error);
        setError('Failed to process payment result');
      } finally {
        setLoading(false);
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleContinue = () => {
    if (result?.success) {
      // Redirect to payment success page
      navigate('/payment/success');
    } else {
      // Redirect back to checkout to try again
      navigate('/checkout');
    }
  };

  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="paymob-result">
        <div className="paymob-result__container">
          <div className="paymob-result__loading">
            <div className="loading-spinner"></div>
            <h2>{t('payment.processing', 'Processing payment...')}</h2>
            <p>{t('payment.processingDescription', 'Please wait while we verify your payment.')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paymob-result">
        <div className="paymob-result__container">
          <div className="paymob-result__error">
            <div className="result-icon error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2>{t('payment.error', 'Payment Error')}</h2>
            <p>{error}</p>
            <button 
              className="paymob-result__button paymob-result__button--primary"
              onClick={handleRetryPayment}
            >
              {t('payment.tryAgain', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.success;

  return (
    <div className="paymob-result">
      <div className="paymob-result__container">
        <div className={`paymob-result__content ${isSuccess ? 'success' : 'failed'}`}>
          <div className={`result-icon ${isSuccess ? 'success-icon' : 'error-icon'}`}>
            {isSuccess ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </div>

          <h2>
            {isSuccess 
              ? t('payment.success', 'Payment Successful!') 
              : t('payment.failed', 'Payment Failed')
            }
          </h2>

          <p>
            {isSuccess 
              ? t('payment.successDescription', 'Your payment has been processed successfully. You will receive a confirmation email shortly.')
              : t('payment.failedDescription', 'We were unable to process your payment. Please try again or contact support if the problem persists.')
            }
          </p>

          {result?.intentionId && (
            <div className="paymob-result__details">
              <div className="detail-item">
                <span className="detail-label">{t('payment.intentionId', 'Payment ID')}:</span>
                <span className="detail-value">{result.intentionId}</span>
              </div>
              {result.transactionId && (
                <div className="detail-item">
                  <span className="detail-label">{t('payment.transactionId', 'Transaction ID')}:</span>
                  <span className="detail-value">{result.transactionId}</span>
                </div>
              )}
              {result.status && (
                <div className="detail-item">
                  <span className="detail-label">{t('payment.status', 'Status')}:</span>
                  <span className="detail-value">{result.status}</span>
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="paymob-result__error-details">
              <p>{result.error}</p>
            </div>
          )}

          <div className="paymob-result__actions">
            {isSuccess ? (
              <button 
                className="paymob-result__button paymob-result__button--primary"
                onClick={handleContinue}
              >
                {t('payment.continue', 'Continue')}
              </button>
            ) : (
              <>
                <button 
                  className="paymob-result__button paymob-result__button--primary"
                  onClick={handleRetryPayment}
                >
                  {t('payment.tryAgain', 'Try Again')}
                </button>
                <button 
                  className="paymob-result__button paymob-result__button--secondary"
                  onClick={() => navigate('/contact')}
                >
                  {t('payment.contactSupport', 'Contact Support')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymobPaymentResult;
