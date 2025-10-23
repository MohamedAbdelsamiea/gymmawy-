import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, BookOpen, ShoppingBag, FileText } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import orderService from '../../../services/orderService';
import programmeService from '../../../services/programmeService';
import subscriptionService from '../../../services/subscriptionService';
import { getGymmawyCoinIcon } from '../../../utils/currencyUtils';

const UserOverview = () => {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  useEffect(() => {
    if (user) {
      loadPurchaseHistory();
    }
  }, [user]);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all purchases (orders, programmes, and subscriptions)
      const [ordersResponse, programmePurchasesResponse, subscriptionsResponse] = await Promise.allSettled([
        orderService.getOrders(),
        programmeService.getUserProgrammes(),
        subscriptionService.getUserSubscriptions()
      ]);

      // Debug: Log the actual API responses
      console.log('🔍 Orders API response:', ordersResponse);
      console.log('🔍 Programmes API response:', programmePurchasesResponse);
      console.log('🔍 Subscriptions API response:', subscriptionsResponse);

      const purchases = [];

      // Process orders
      if (ordersResponse.status === 'fulfilled') {
        const ordersData = ordersResponse.value?.items || ordersResponse.value?.data || [];
        console.log('📦 Processing orders:', ordersData.length);
        if (Array.isArray(ordersData)) {
          ordersData.forEach(order => {
            purchases.push({
              id: order.id,
              type: 'order',
              date: order.createdAt,
              items: order.items?.map(item => {
                const name = item.product?.name || item.name;
                return typeof name === 'object' ? (name.en || name.ar || 'Product') : name;
              }).join(', ') || 'Order',
              amount: parseFloat(order.totalAmount || order.price || 0),
              currency: order.currency || 'EGP',
              status: order.status,
              loyaltyPointsEarned: order.loyaltyPointsEarned || 0,
              reference: order.orderNumber || order.id
            });
          });
        }
      } else if (ordersResponse.status === 'rejected') {
        console.error('❌ Failed to fetch orders:', ordersResponse.reason);
      }

      // Process programme purchases
      if (programmePurchasesResponse.status === 'fulfilled') {
        const programmesData = Array.isArray(programmePurchasesResponse.value) 
          ? programmePurchasesResponse.value 
          : programmePurchasesResponse.value?.data || programmePurchasesResponse.value?.items || [];
        console.log('📚 Processing programmes:', programmesData.length);
        if (Array.isArray(programmesData)) {
          programmesData.forEach(purchase => {
            purchases.push({
              id: purchase.id,
              type: 'programme',
              date: purchase.purchasedAt || purchase.createdAt,
              items: typeof purchase.programme?.name === 'object' 
                ? (purchase.programme.name.en || purchase.programme.name.ar || 'Programme')
                : (purchase.programme?.name || 'Programme'),
              amount: parseFloat(purchase.price || 0),
              currency: purchase.currency || 'EGP',
              status: purchase.status,
              loyaltyPointsEarned: 0,
              reference: purchase.purchaseNumber || purchase.id
            });
          });
        }
      } else if (programmePurchasesResponse.status === 'rejected') {
        console.error('❌ Failed to fetch programmes:', programmePurchasesResponse.reason);
      }

      // Process subscriptions
      if (subscriptionsResponse.status === 'fulfilled') {
        const subscriptionsData = subscriptionsResponse.value?.items || subscriptionsResponse.value?.data || [];
        console.log('💳 Processing subscriptions:', subscriptionsData.length);
        if (Array.isArray(subscriptionsData)) {
          subscriptionsData.forEach(subscription => {
            purchases.push({
              id: subscription.id,
              type: 'subscription',
              date: subscription.createdAt || subscription.startDate,
              items: typeof subscription.subscriptionPlan?.name === 'object' 
                ? (subscription.subscriptionPlan.name.en || subscription.subscriptionPlan.name.ar || 'Subscription Plan')
                : (subscription.subscriptionPlan?.name || 'Subscription Plan'),
              amount: parseFloat(subscription.price || 0),
              currency: subscription.currency || 'EGP',
              status: subscription.status,
              loyaltyPointsEarned: subscription.subscriptionPlan?.loyaltyPointsAwarded || 0,
              reference: subscription.subscriptionNumber || subscription.id
            });
          });
        }
      } else if (subscriptionsResponse.status === 'rejected') {
        console.error('❌ Failed to fetch subscriptions:', subscriptionsResponse.reason);
      }

      // Sort by date (newest first)
      purchases.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('✅ Total purchases loaded:', purchases.length);
      console.log('📊 Sample purchase data:', purchases[0]);
      
      if (purchases.length === 0) {
        console.log('⚠️ No purchases found. This could be because:');
        console.log('- User has no orders, programmes, or subscriptions');
        console.log('- API endpoints are returning empty data');
        console.log('- Data structure is different than expected');
      }
      
      setPurchaseHistory(purchases);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'delivered':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">{t('common.error')}</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={loadPurchaseHistory}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section with Gymmawy Points */}
      <div className="bg-gradient-to-r from-gymmawy-primary to-gymmawy-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t('user.overview.title', 'Welcome')}, {user?.firstName || user?.name || 'User'}!
            </h1>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {getGymmawyCoinIcon({ size: 32, className: "flex-shrink-0" })}
              <span className="text-3xl font-bold">{user?.loyaltyPoints || 0}</span>
            </div>
            <p className="text-sm opacity-90">{t('user.overview.loyaltyPoints', 'Gymmawy Points')}</p>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('user.overview.purchaseHistory', 'Purchase History')}
          </h3>
          <button
            onClick={loadPurchaseHistory}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gymmawy-primary text-white rounded-md hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {purchaseHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.date', 'Date')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.type', 'Type')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.reference', 'Reference')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.items', 'Items')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.amount', 'Amount')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.status', 'Status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user.overview.pointsEarned', 'Points Earned')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseHistory.map((purchase) => (
                  <tr key={`${purchase.type}-${purchase.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(purchase.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {purchase.type === 'order' ? (
                          <ShoppingBag className="h-4 w-4 text-blue-600 mr-2" />
                        ) : purchase.type === 'subscription' ? (
                          <BookOpen className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 text-purple-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">{purchase.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {purchase.reference || purchase.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {purchase.items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.amount === 0 ? (
                        <span className="text-orange-600 font-semibold">FREE</span>
                      ) : (
                        `${typeof purchase.amount === 'number' ? purchase.amount.toFixed(2) : purchase.amount || '0.00'} ${purchase.currency}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                        {purchase.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.loyaltyPointsEarned > 0 ? (
                        <span className="flex items-center text-green-600 font-semibold">
                          {getGymmawyCoinIcon({ size: 16, className: "mr-1" })}
                          +{purchase.loyaltyPointsEarned}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t('user.overview.noPurchases', 'No purchases yet')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('user.overview.startShopping', 'Start shopping to see your purchase history here')}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
                  <p className="font-medium">Debug Info:</p>
                  <p>Check browser console for API response details</p>
                  <p>Click "Refresh" to retry loading purchases</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserOverview;
