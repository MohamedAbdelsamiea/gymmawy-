import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Gift, TrendingUp, Package, CreditCard, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StatCard, StatusBadge } from '../../../components/dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/userService';
import subscriptionService from '../../../services/subscriptionService';
import orderService from '../../../services/orderService';
import loyaltyService from '../../../services/loyaltyService';

const UserOverview = () => {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    subscription: {
      plan: 'No Active Plan',
      status: 'Inactive',
      expiryDate: null,
      autoRenew: false
    },
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: '$0.00'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState([]);
  const [loyaltyStats, setLoyaltyStats] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    currentBalance: 0
  });

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
      const [userStatsResponse, subscriptions, orders, loyaltyTransactionsResponse, loyaltyStatsResponse] = await Promise.allSettled([
        userService.getUserStats(),
        subscriptionService.getUserSubscriptions(),
        orderService.getOrders(),
        loyaltyService.getRecentTransactions(),
        loyaltyService.getStats()
      ]);

      // Process user stats
      let stats = {
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: '$0.00',
        workoutsThisMonth: 0
      };

      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value?.stats) {
        const userStatsData = userStatsResponse.value.stats;
        stats = {
          loyaltyPoints: userStatsData.loyaltyPoints || 0,
          totalOrders: userStatsData.orders?.total || 0,
          totalSpent: `$${(userStatsData.spending?.total || 0).toFixed(2)}`,
          workoutsThisMonth: userStatsData.workoutsThisMonth || 0
        };
      }

      // Process subscriptions
      let activeSubscription = null;
      if (subscriptions.status === 'fulfilled' && subscriptions.value?.data?.length > 0) {
        activeSubscription = subscriptions.value.data.find(sub => sub.status === 'active');
      }

      // Process orders for recent activity
      let recentActivities = [];
      if (orders.status === 'fulfilled' && orders.value?.data) {
        recentActivities = orders.value.data.slice(0, 4).map((order, index) => ({
          id: index + 1,
          action: t('user.overview.orderPlaced'),
          description: `Order #${order.id} - ${order.status}`,
          time: formatTimeAgo(order.createdAt),
          type: 'order'
        }));
      }

      setUserStats({
        subscription: activeSubscription ? {
          plan: activeSubscription.plan?.name || 'Unknown Plan',
          status: activeSubscription.status || 'Inactive',
          expiryDate: activeSubscription.endDate,
          autoRenew: activeSubscription.autoRenew || false
        } : {
          plan: 'No Active Plan',
          status: 'Inactive',
          expiryDate: null,
          autoRenew: false
        },
        ...stats
      });

      setRecentActivity(recentActivities);

      // Process loyalty transactions
      if (loyaltyTransactionsResponse.status === 'fulfilled' && loyaltyTransactionsResponse.value.success) {
        const formattedTransactions = loyaltyTransactionsResponse.value.transactions.map(transaction => 
          loyaltyService.formatTransaction(transaction)
        );
        setLoyaltyTransactions(formattedTransactions);
      }

      // Process loyalty stats
      if (loyaltyStatsResponse.status === 'fulfilled' && loyaltyStatsResponse.value.success) {
        setLoyaltyStats(loyaltyStatsResponse.value.stats);
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('user.overview.loyaltyPoints')}
          value={userStats.loyaltyPoints.toLocaleString()}
          icon={Gift}
          color="purple"
        />
        <StatCard
          title={t('user.overview.totalOrders')}
          value={userStats.totalOrders}
          icon={Package}
          color="blue"
        />
        <StatCard
          title={t('user.overview.totalSpent')}
          value={userStats.totalSpent}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title={t('user.overview.workoutsThisMonth')}
          value={userStats.workoutsThisMonth}
          change="+15%"
          changeType="positive"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Subscription Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('user.overview.subscriptionStatus')}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gymmawy-primary bg-opacity-10 rounded-lg">
              <Package className="h-6 w-6 text-gymmawy-primary" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{userStats.subscription.plan}</h4>
              <p className="text-sm text-gray-600">
                {userStats.subscription.expiryDate 
                  ? `${t('user.overview.expiresOn')} ${new Date(userStats.subscription.expiryDate).toLocaleDateString()}`
                  : t('user.overview.noActiveSubscription')
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={userStats.subscription.status} />
            <p className="text-sm text-gray-600 mt-1">
              {userStats.subscription.autoRenew ? t('user.overview.autoRenewalEnabled') : t('user.overview.autoRenewalDisabled')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('user.overview.recentActivity')}</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'workout' ? 'bg-green-500' :
                    activity.type === 'order' ? 'bg-blue-500' :
                    activity.type === 'loyalty' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">{t('user.overview.noRecentActivity')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('user.overview.upcomingEvents')}</h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-gymmawy-primary bg-opacity-10 rounded-lg">
                    <Calendar className="h-4 w-4 text-gymmawy-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.date} at {event.time}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-gymmawy-primary bg-opacity-10 rounded-lg w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-gymmawy-primary" />
                </div>
                <p className="text-gray-500 text-sm">{t('user.overview.noUpcomingEvents')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Loyalty Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Loyalty Activity</h3>
          <button 
            onClick={() => window.location.href = '/dashboard/loyalty-history'}
            className="text-sm text-gymmawy-primary hover:text-gymmawy-primary-dark font-medium flex items-center"
          >
            View Full History
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="space-y-3">
          {loyaltyTransactions.length > 0 ? (
            loyaltyTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${loyaltyService.getTransactionColorClass(transaction)}`}>
                    {transaction.isEarned ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.action} {Math.abs(transaction.points)} points
                    </p>
                    <p className="text-xs text-gray-600">
                      {transaction.sourceDisplay} • {transaction.reason || 'No reason provided'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${transaction.isEarned ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.pointsDisplay}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.formattedDate}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="p-3 bg-gymmawy-primary bg-opacity-10 rounded-lg w-fit mx-auto mb-3">
                <Award className="h-6 w-6 text-gymmawy-primary" />
              </div>
              <p className="text-gray-500 text-sm">No loyalty activity yet</p>
              <p className="text-xs text-gray-400 mt-1">Start earning points by making purchases or referring friends!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('user.overview.quickActions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="h-5 w-5 mr-2 text-gymmawy-primary" />
            <span className="font-medium">{t('user.overview.startWorkout')}</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Gift className="h-5 w-5 mr-2 text-gymmawy-primary" />
            <span className="font-medium">{t('user.overview.redeemPoints')}</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CreditCard className="h-5 w-5 mr-2 text-gymmawy-primary" />
            <span className="font-medium">{t('user.overview.shopNow')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserOverview;
