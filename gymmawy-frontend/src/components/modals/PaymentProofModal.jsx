import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import { useSecureImage } from '../../hooks/useSecureImage';

const PaymentProofModal = ({ 
  isOpen, 
  onClose, 
  payment, 
  onApprove, 
  onReject, 
  isLoading = false 
}) => {
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  
  // Use secure image hook for payment proof
  const { dataUrl: secureImageUrl, loading: imageLoading, error: imageError } = useSecureImage(
    payment?.paymentProofUrl || payment?.proofFile
  );

  if (!isOpen || !payment) return null;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(payment.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(payment.id);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment Proof Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              Payment Reference: {payment.paymentReference || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-lg font-semibold text-green-600">
                    {payment.amount} {payment.currency}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.method === 'VODAFONE_CASH' ? 'bg-green-100 text-green-800' :
                    payment.method === 'INSTA_PAY' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.method}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'PENDING_VERIFICATION' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Reference</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {payment.paymentReference || 'N/A'}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                  <p className="text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.paymentableType === 'SUBSCRIPTION' ? 'bg-blue-100 text-blue-800' :
                      payment.paymentableType === 'ORDER' ? 'bg-green-100 text-green-800' :
                      payment.paymentableType === 'PROGRAMME_PURCHASE' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {payment.paymentableType || 'N/A'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paymentable ID</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {payment.paymentableId || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-sm text-gray-900">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Proof Image */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Payment Proof</h3>
              </div>

              {/* Image Container */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative group h-64">
                {imageLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading image...</p>
                    </div>
                  </div>
                ) : imageError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600">Failed to load image</p>
                      <p className="text-xs text-gray-500 mt-1">Please try again or contact support</p>
                    </div>
                  </div>
                ) : secureImageUrl ? (
                  <>
                    <img
                      src={secureImageUrl}
                      alt="Payment Proof"
                      className="w-full h-full object-contain bg-gray-50"
                      onError={() => {
                        console.error('Image failed to load');
                      }}
                    />
                    {/* Full-screen preview button overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={() => setShowFullscreenPreview(true)}
                        className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-all duration-200"
                        type="button"
                        title="View full size"
                      >
                        <Eye className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No payment proof available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Review the payment proof and choose an action
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject Payment
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {showFullscreenPreview && secureImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative">
              <img
                src={secureImageUrl}
                alt="Payment Proof - Full Size"
                className="max-w-none h-auto rounded-lg"
                onError={(e) => {
                  console.error('Full preview image load error:', e);
                  e.target.style.display = 'none';
                }}
              />
              <button
                onClick={() => setShowFullscreenPreview(false)}
                className="fixed top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200 z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentProofModal;
