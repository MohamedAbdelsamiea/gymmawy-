import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Package } from 'lucide-react';
import { StatusBadge } from '../../../components/dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import programmeService from '../../../services/programmeService';
import subscriptionService from '../../../services/subscriptionService';
import orderService from '../../../services/orderService';

const UserOverview = () => {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel
      const [programmesResponse, subscriptionsResponse, ordersResponse] = await Promise.allSettled([
        programmeService.getUserProgrammes(),
        subscriptionService.getUserSubscriptions(),
        orderService.getOrders()
      ]);

      // Process programmes
      console.log('📦 Programmes Response:', programmesResponse);
      if (programmesResponse.status === 'fulfilled') {
        // Handle direct array response
        if (Array.isArray(programmesResponse.value)) {
          console.log('✅ Programmes data (direct array):', programmesResponse.value);
          console.log('📋 First programme details:', programmesResponse.value[0]);
          setProgrammes(programmesResponse.value);
        } else if (programmesResponse.value?.items) {
          console.log('✅ Programmes data:', programmesResponse.value.items);
          console.log('📋 First programme details:', programmesResponse.value.items[0]);
          setProgrammes(programmesResponse.value.items);
        } else if (programmesResponse.value?.programmes) {
          console.log('✅ Programmes data (alt structure):', programmesResponse.value.programmes);
          console.log('📋 First programme details:', programmesResponse.value.programmes[0]);
          setProgrammes(programmesResponse.value.programmes);
        }
      }

      // Process subscriptions
      console.log('📅 Subscriptions Response:', subscriptionsResponse);
      if (subscriptionsResponse.status === 'fulfilled' && subscriptionsResponse.value?.items) {
        console.log('✅ Subscriptions data:', subscriptionsResponse.value.items);
        setSubscriptions(subscriptionsResponse.value.items);
      } else if (subscriptionsResponse.status === 'fulfilled' && subscriptionsResponse.value?.subscriptions) {
        console.log('✅ Subscriptions data (alt structure):', subscriptionsResponse.value.subscriptions);
        setSubscriptions(subscriptionsResponse.value.subscriptions);
      }

      // Process orders
      console.log('🛒 Orders Response:', ordersResponse);
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.items) {
        console.log('✅ Orders data:', ordersResponse.value.items);
        setOrders(ordersResponse.value.items);
      } else if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.orders) {
        console.log('✅ Orders data (alt structure):', ordersResponse.value.orders);
        setOrders(ordersResponse.value.orders);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
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
              onClick={loadDashboardData}
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gymmawy-primary to-gymmawy-secondary rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {t('user.overview.title')}, {user?.firstName || user?.name || 'User'}!
        </h1>
        <p className="text-gymmawy-light opacity-90">
          {t('user.overview.subtitle')}
        </p>
      </div>

      {/* Purchase History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Purchase History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Programmes Rows */}
              {programmes.map((programme) => (
                <tr key={programme.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {programme.purchaseNumber || programme.id?.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-gray-100">
                        {programme.programme?.imageUrl ? (
                          <img 
                            src={programme.programme.imageUrl} 
                            alt={typeof programme.programme?.name === 'object' 
                              ? (programme.programme.name.en || programme.programme.name.ar) 
                              : programme.programme?.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900 font-medium">
                          {typeof programme.programme?.name === 'object' 
                            ? (programme.programme.name.en || programme.programme.name.ar) 
                            : programme.programme?.name || 'Programme'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(programme.purchasedAt || programme.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {programme.expiresAt ? new Date(programme.expiresAt).toLocaleDateString() : 'Lifetime'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {programme.price || programme.amount} {programme.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={programme.status || 'active'} />
                  </td>
                </tr>
              ))}

              {/* Subscriptions Rows */}
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {subscription.subscriptionNumber || subscription.orderNumber || subscription.id?.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {subscription.plan?.name || 'Subscription Plan'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(subscription.createdAt || subscription.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {subscription.amount} {subscription.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={subscription.status || 'active'} />
                  </td>
                </tr>
              ))}

              {/* Orders Rows */}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {order.orderNumber || order.id?.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      Order #{order.orderNumber || order.id?.slice(0, 8)}
                    </div>
                    <div className="text-xs text-gray-500">{order.items?.length || 0} item(s)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {order.totalAmount || order.amount} {order.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status || 'processing'} />
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {programmes.length === 0 && subscriptions.length === 0 && orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No purchase history yet</p>
                      <p className="text-xs mt-1">Your purchases will appear here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default UserOverview;
