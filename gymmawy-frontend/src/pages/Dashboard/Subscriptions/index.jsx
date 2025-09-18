import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { config } from '../../../config';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async() => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.items || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Subscriptions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadSubscriptions}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Subscriptions</h1>
      
      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Yet</h2>
          <p className="text-gray-600 mb-6">You haven't subscribed to any plans yet.</p>
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Browse Plans
          </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {subscription.subscriptionPlan?.name || 'Subscription Plan'}
                </h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                  subscription.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {subscription.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium text-indigo-600">
                    {subscription.price} {subscription.currency}
                    {subscription.originalPrice && subscription.originalPrice > subscription.price && (
                      <div className="text-xs text-gray-500">
                        <span className="line-through">{subscription.originalPrice} {subscription.currency}</span>
                        <span className="text-green-600 ml-1">
                          (Save {subscription.originalPrice - subscription.price} {subscription.currency})
                        </span>
                      </div>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{subscription.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      subscription.medical ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {subscription.medical ? 'Medical' : 'Normal'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Discount</p>
                  <p className="font-medium">
                    {subscription.discount > 0 ? (
                      <div className="text-sm">
                        <div className="text-green-600 font-semibold">{subscription.discount}% total</div>
                        {subscription.planDiscountPercentage > 0 && (
                          <div className="text-xs text-gray-500">
                            Plan: {subscription.planDiscountPercentage}%
                            {subscription.couponDiscountPercentage > 0 && (
                              <span> + Coupon: {subscription.couponDiscountPercentage}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : 'No discount'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription Number</p>
                  <p className="font-medium text-sm font-mono">{subscription.subscriptionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(subscription.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {subscription.subscriptionPlan?.subscriptionPeriodDays ? 
                      `${subscription.subscriptionPlan.subscriptionPeriodDays} days` : 'N/A'}
                    {subscription.subscriptionPlan?.giftPeriodDays > 0 && 
                      ` + ${subscription.subscriptionPlan.giftPeriodDays} gift days`}
                  </p>
                </div>
              </div>
              
              {subscription.subscriptionPlan?.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Description:</p>
                  <p className="text-sm text-gray-700">{subscription.subscriptionPlan.description}</p>
                </div>
              )}
              
              {subscription.status === 'ACTIVE' && (
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Manage
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
