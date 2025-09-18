import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import adminApiService from '../../services/adminApiService';

const AddCouponModal = ({ isOpen, onClose, onSuccess, editData, isEdit = false }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountValue: '',
    expirationDate: '',
    maxRedemptionsPerUser: '',
    maxRedemptions: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && editData) {
      setFormData({
        code: editData.code || '',
        discountValue: editData.discountPercentage?.toString() || '',
        expirationDate: editData.expirationDate ? new Date(editData.expirationDate).toISOString().split('T')[0] : '',
        maxRedemptionsPerUser: editData.maxRedemptionsPerUser?.toString() || '',
        maxRedemptions: editData.maxRedemptions?.toString() || '',
        isActive: editData.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        discountValue: '',
        expirationDate: '',
        maxRedemptionsPerUser: '',
        maxRedemptions: '',
        isActive: true,
      });
    }
    setError(null);
    setErrors({});
  }, [isEdit, editData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Coupon code must be at least 3 characters';
    }

    if (!formData.discountValue) {
      newErrors.discountValue = 'Discount value is required';
    } else {
      const value = parseFloat(formData.discountValue);
      if (isNaN(value) || value <= 0) {
        newErrors.discountValue = 'Discount value must be a positive number';
      }
      if (value > 100) {
        newErrors.discountValue = 'Percentage discount cannot exceed 100%';
      }
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date is required';
    } else if (new Date(formData.expirationDate) <= new Date()) {
      newErrors.expirationDate = 'Expiration date must be in the future';
    }

    // Max redemptions per user is optional - if empty, it defaults to unlimited (0)
    if (formData.maxRedemptionsPerUser && formData.maxRedemptionsPerUser !== '') {
      const maxRedemptionsPerUser = parseInt(formData.maxRedemptionsPerUser);
      if (isNaN(maxRedemptionsPerUser) || maxRedemptionsPerUser < 0) {
        newErrors.maxRedemptionsPerUser = 'Max redemptions per user must be a non-negative number';
      }
    }

    // Max total redemptions is optional - if empty, it defaults to unlimited (0)
    if (formData.maxRedemptions && formData.maxRedemptions !== '') {
      const maxRedemptions = parseInt(formData.maxRedemptions);
      if (isNaN(maxRedemptions) || maxRedemptions < 0) {
        newErrors.maxRedemptions = 'Max total redemptions must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        maxRedemptionsPerUser: formData.maxRedemptionsPerUser ? parseInt(formData.maxRedemptionsPerUser) : 0,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : 0,
        expirationDate: new Date(formData.expirationDate).toISOString(),
      };

      console.log('Frontend formData:', formData);
      console.log('Frontend submitData:', submitData);

      if (isEdit) {
        await adminApiService.updateCoupon(editData.id, submitData);
      } else {
        await adminApiService.createCoupon(submitData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError(err.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Coupon' : 'Add New Coupon'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter coupon code"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
          </div>


          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                max="100"
                className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.discountValue ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            {errors.discountValue && (
              <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.expirationDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.expirationDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expirationDate}</p>
            )}
          </div>

          {/* Max Redemptions Per User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Redemptions Per User
            </label>
            <input
              type="number"
              name="maxRedemptionsPerUser"
              value={formData.maxRedemptionsPerUser}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxRedemptionsPerUser ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0 = unlimited"
            />
            {errors.maxRedemptionsPerUser && (
              <p className="mt-1 text-sm text-red-600">{errors.maxRedemptionsPerUser}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Maximum times a single user can redeem this coupon. Set to 0 for unlimited redemptions per user.</p>
          </div>

          {/* Max Total Redemptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Total Redemptions
            </label>
            <input
              type="number"
              name="maxRedemptions"
              value={formData.maxRedemptions}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxRedemptions ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0 = unlimited"
            />
            {errors.maxRedemptions && (
              <p className="mt-1 text-sm text-red-600">{errors.maxRedemptions}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Maximum total times this coupon can be redeemed by all users. Set to 0 for unlimited total redemptions.</p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active coupon
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCouponModal;
