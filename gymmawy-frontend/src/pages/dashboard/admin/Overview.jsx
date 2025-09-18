import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Eye,
  UserPlus,
  Package,
  RefreshCw,
  Gift,
  BookOpen,
} from 'lucide-react';
import { StatCard, ChartCard } from '../../../components/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import adminApiService from '../../../services/adminApiService';

const AdminOverview = () => {
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [topSellingData, setTopSellingData] = useState({ programmes: [], subscriptions: [], products: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('EGP');
  const currencies = ['EGP', 'SAR', 'AED', 'USD'];
  const [selectedTrend, setSelectedTrend] = useState('subscriptions');
  const [selectedTopSelling, setSelectedTopSelling] = useState('programmes');
  const [exchangeRates, setExchangeRates] = useState({
    EGP: 0.032, // Fallback rates (ExchangeRate-API.com will update these)
    SAR: 0.27,
    AED: 0.27,
    USD: 1
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  // Calculate total revenue in USD
  const calculateTotalRevenueUSD = () => {
    if (!stats) return 0;
    
    let totalUSD = 0;
    currencies.forEach(currency => {
      const revenue = stats[`revenue${currency}`]?.total || 0;
      const rate = exchangeRates[currency];
      totalUSD += revenue * rate;
    });
    
    return Number(totalUSD.toFixed(2));
  };

  // Calculate weekly total revenue in USD
  const calculateWeeklyRevenueUSD = () => {
    if (!stats) return 0;
    
    let weeklyUSD = 0;
    currencies.forEach(currency => {
      const weeklyRevenue = stats[`revenue${currency}`]?.week || 0;
      const rate = exchangeRates[currency];
      weeklyUSD += weeklyRevenue * rate;
    });
    
    return Number(weeklyUSD.toFixed(2));
  };

  // Fetch live exchange rates using ExchangeRate-API.com (supports EGP, SAR, AED)
  const fetchExchangeRates = async () => {
    try {
      setRatesLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      
      // ExchangeRate-API.com returns rates as USD to other currencies, so we invert them
      const newRates = {
        EGP: data.rates.EGP ? 1 / data.rates.EGP : 0.032, // USD to EGP, then invert to get EGP to USD
        SAR: data.rates.SAR ? 1 / data.rates.SAR : 0.27,  // USD to SAR, then invert to get SAR to USD
        AED: data.rates.AED ? 1 / data.rates.AED : 0.27,  // USD to AED, then invert to get AED to USD
        USD: 1
      };
      
      setExchangeRates(newRates);
      setRatesLastUpdated(new Date());
      console.log('Live exchange rates updated (ExchangeRate-API.com):', newRates);
    } catch (error) {
      console.error('Failed to fetch exchange rates, using fallback:', error);
      // Keep the fallback rates if API fails
    } finally {
      setRatesLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
    fetchExchangeRates();
  }, []);

  const fetchDashboardData = async() => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch core dashboard stats first (most important)
      const statsResponse = await adminApiService.getDashboardStats();
      setStats(statsResponse.stats);
      
      // Fetch additional data in parallel, but don't fail if some endpoints are down
      const additionalDataPromises = [
        adminApiService.getTrendData().catch(err => {
          console.warn('Trend data failed:', err.message);
          return { trends: { revenue: [] } };
        }),
        adminApiService.getMonthlyTrends(12).catch(err => {
          console.warn('Monthly trends failed:', err.message);
          return { trends: { monthlyData: [] } };
        }),
        adminApiService.getTopSellingData('programmes', 10).catch(err => {
          console.warn('Top selling programmes failed:', err.message);
          return { topSelling: [] };
        }),
        adminApiService.getTopSellingData('subscriptions', 10).catch(err => {
          console.warn('Top selling subscriptions failed:', err.message);
          return { topSelling: [] };
        }),
        adminApiService.getTopSellingData('products', 10).catch(err => {
          console.warn('Top selling products failed:', err.message);
          return { topSelling: [] };
        }),
        adminApiService.getRecentActivity().catch(err => {
          console.warn('Recent activity failed:', err.message);
          return { activity: [] };
        }),
      ];
      
      const [trendResponse, monthlyTrendsResponse, topSellingProgrammesResponse, topSellingSubscriptionsResponse, topSellingProductsResponse, activityResponse] = await Promise.all(additionalDataPromises);
      
      setTrendData(trendResponse.trends?.revenue || []);
      setMonthlyTrends(monthlyTrendsResponse.trends?.monthlyData || []);
      
      setTopSellingData({ 
        programmes: topSellingProgrammesResponse.topSelling || [], 
        subscriptions: topSellingSubscriptionsResponse.topSelling || [], 
        products: topSellingProductsResponse.topSelling || [], 
      });
      setRecentActivity(activityResponse.activity || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions?.total?.toLocaleString() || "0"}
          change={`+${stats?.activeSubscriptions?.week || 0} this week`}
          changeType="positive"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Program Purchases"
          value={stats?.programPurchases?.total?.toLocaleString() || "0"}
          change={`+${stats?.programPurchases?.week || 0} this week`}
          changeType="positive"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={stats?.orders?.total?.toLocaleString() || "0"}
          change={`+${stats?.orders?.week || 0} this week`}
          changeType="positive"
          icon={ShoppingBag}
          color="green"
        />
        <div className="relative">
          <StatCard
            title={`Revenue (${selectedCurrency})`}
            value={`${selectedCurrency} ${stats?.[`revenue${selectedCurrency}`]?.total?.toLocaleString() || "0"}`}
            change={`+${selectedCurrency} ${stats?.[`revenue${selectedCurrency}`]?.week?.toLocaleString() || "0"} this week`}
            changeType="positive"
            icon={DollarSign}
            color="orange"
          />
          {/* Currency Toggle - Attached to top of card frame */}
          <div className="absolute -top-2 right-3">
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1 shadow-sm">
              {currencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedCurrency === currency
                      ? 'bg-gymmawy-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="relative">
          <ChartCard 
            title={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Trend`} 
            subtitle="Monthly data and revenue by currency"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    const isRevenue = name.includes('Revenue') || name === 'totalRevenue' || name === 'totalRevenueUSD';
                    const formattedValue = isRevenue ? Number(value).toFixed(2) : value;
                    return [
                      formattedValue, 
                      name === 'subscriptions' ? 'Subscriptions Count' :
                      name === 'orders' ? 'Orders Count' :
                      name === 'programmes' ? 'Programmes Count' :
                      name === 'subscriptionRevenueEgp' ? 'Subscription Revenue (EGP)' :
                      name === 'subscriptionRevenueSar' ? 'Subscription Revenue (SAR)' :
                      name === 'subscriptionRevenueAed' ? 'Subscription Revenue (AED)' :
                      name === 'subscriptionRevenueUsd' ? 'Subscription Revenue (USD)' :
                      name === 'orderRevenueEgp' ? 'Order Revenue (EGP)' :
                      name === 'orderRevenueSar' ? 'Order Revenue (SAR)' :
                      name === 'orderRevenueAed' ? 'Order Revenue (AED)' :
                      name === 'orderRevenueUsd' ? 'Order Revenue (USD)' :
                      name === 'programmeRevenueEgp' ? 'Programme Revenue (EGP)' :
                      name === 'programmeRevenueSar' ? 'Programme Revenue (SAR)' :
                      name === 'programmeRevenueAed' ? 'Programme Revenue (AED)' :
                      name === 'programmeRevenueUsd' ? 'Programme Revenue (USD)' :
                      name === 'egpRevenue' ? 'Total Revenue (EGP)' :
                      name === 'sarRevenue' ? 'Total Revenue (SAR)' :
                      name === 'aedRevenue' ? 'Total Revenue (AED)' :
                      name === 'usdRevenue' ? 'Total Revenue (USD)' :
                      name === 'totalRevenue' ? 'Total Revenue' :
                      name === 'totalRevenueUSD' ? 'Total Revenue (USD)' : name,
                    ];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedTrend} 
                  stroke="#3F0071" 
                  strokeWidth={3}
                  yAxisId="left"
                  name={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Count`}
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedTrend.slice(0, -1)}RevenueEgp`}
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  yAxisId="right"
                  name={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Revenue (EGP)`}
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedTrend.slice(0, -1)}RevenueSar`}
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  yAxisId="right"
                  name={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Revenue (SAR)`}
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedTrend.slice(0, -1)}RevenueAed`}
                  stroke="#10B981" 
                  strokeWidth={2}
                  yAxisId="right"
                  name={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Revenue (AED)`}
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedTrend.slice(0, -1)}RevenueUsd`}
                  stroke="#EF4444" 
                  strokeWidth={2}
                  yAxisId="right"
                  name={`${selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)} Revenue (USD)`}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalRevenueUSD"
                  stroke="#8B5A2B" 
                  strokeWidth={3}
                  yAxisId="right"
                  strokeDasharray="5 5"
                  name="Total Revenue (USD)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          {/* Trend Toggle - Top Right */}
          <div className="absolute top-2 right-2">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedTrend('subscriptions')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTrend === 'subscriptions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setSelectedTrend('programmes')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTrend === 'programmes'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Programmes
              </button>
              <button
                onClick={() => setSelectedTrend('orders')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTrend === 'orders'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="relative">
          <ChartCard 
            title={`Top Selling ${selectedTopSelling.charAt(0).toUpperCase() + selectedTopSelling.slice(1)}`} 
            subtitle="Best performing items by sales"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(topSellingData?.[selectedTopSelling] || []).map(item => ({
                ...item,
                displayName: typeof item.name === 'object' ? item.name.en || item.name.ar : item.name,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, (dataMax) => Math.max(dataMax, 5)]}
                  tickCount={6}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? Number(value).toFixed(2) : value, 
                    name === 'sales' ? 'Sales' : 'Revenue',
                  ]}
                  labelFormatter={(label) => `Item: ${label}`}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#3F0071" 
                  name="sales"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {/* Top Selling Toggle - Top Right */}
          <div className="absolute top-2 right-2">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedTopSelling('programmes')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTopSelling === 'programmes'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Programmes
              </button>
              <button
                onClick={() => setSelectedTopSelling('subscriptions')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTopSelling === 'subscriptions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setSelectedTopSelling('products')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTopSelling === 'products'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative">
          <StatCard
            title="Total Revenue (USD)"
            value={`$${calculateTotalRevenueUSD().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={`+$${calculateWeeklyRevenueUSD().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} this week`}
            changeType="positive"
            icon={TrendingUp}
            color="emerald"
          />
          <div className="absolute -top-2 right-3">
            <button
              onClick={fetchExchangeRates}
              disabled={ratesLoading}
              className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              title="Refresh exchange rates"
            >
              <RefreshCw className={`w-3 h-3 text-gray-600 ${ratesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {ratesLastUpdated && (
            <div className="absolute -bottom-1 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
              Updated: {ratesLastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <StatCard
          title="Total Users"
          value={stats?.users?.total?.toLocaleString() || "0"}
          change={`+${stats?.users?.week || 0} this week`}
          changeType="positive"
          icon={UserPlus}
          color="blue"
        />
        <StatCard
          title="Loyalty Points Rewarded"
          value={stats?.loyaltyPointsRewarded?.total?.toLocaleString() || "0"}
          change={`+${stats?.loyaltyPointsRewarded?.week || 0} this week`}
          changeType="positive"
          icon={Gift}
          color="green"
        />
        <StatCard
          title="Loyalty Points Redeemed"
          value={stats?.loyaltyPointsRedeemed?.total?.toLocaleString() || "0"}
          change={`+${stats?.loyaltyPointsRedeemed?.week || 0} this week`}
          changeType="positive"
          icon={Package}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.overview.recentActivity')}</h3>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'subscription' ? 'bg-green-500' :
                  activity.type === 'order' ? 'bg-blue-500' :
                  activity.type === 'payment' ? 'bg-emerald-500' :
                  activity.type === 'user' ? 'bg-purple-500' :
                  activity.type === 'programme' ? 'bg-orange-500' :
                  activity.type === 'loyalty' ? 'bg-pink-500' :
                  'bg-gray-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  {activity.amount && (
                    <p className="text-xs text-gray-500 mt-1">{activity.amount}</p>
                  )}
                  {activity.points && (
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.points > 0 ? '+' : ''}{activity.points} points
                      {activity.reason && ` - ${activity.reason}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Just now'}
                </span>
                {activity.user && (
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.user.firstName} {activity.user.lastName}
                  </p>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No recent activity</p>
                <p className="text-xs text-gray-500">Activity will appear here as users interact with the system</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;

