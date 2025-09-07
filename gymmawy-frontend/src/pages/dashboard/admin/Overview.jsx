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
  Gift,
  BookOpen
} from 'lucide-react';
import { StatCard, ChartCard } from '../../../components/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import adminApiService from '../../../services/adminApiService';

const AdminOverview = () => {
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [topSellingData, setTopSellingData] = useState({ programmes: [], subscriptions: [], products: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('EGP');
  const [selectedTrend, setSelectedTrend] = useState('subscriptions');
  const [selectedTopSelling, setSelectedTopSelling] = useState('programmes');
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data in parallel
      const [statsResponse, trendResponse, topSellingResponse, activityResponse] = await Promise.all([
        adminApiService.getDashboardStats(),
        adminApiService.getTrendData(),
        adminApiService.getTopSellingData(),
        adminApiService.getRecentActivity()
      ]);
      
      setStats(statsResponse.stats);
      setTrendData(trendResponse.trendData);
      setTopSellingData(topSellingResponse.topSellingData);
      setRecentActivity(activityResponse.recentActivity);
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
            value={`${selectedCurrency === 'EGP' ? 'EGP' : 'SAR'} ${stats?.[`revenue${selectedCurrency}`]?.total?.toLocaleString() || "0"}`}
            change={`+${selectedCurrency === 'EGP' ? 'EGP' : 'SAR'} ${stats?.[`revenue${selectedCurrency}`]?.week || 0} this week`}
            changeType="positive"
            icon={DollarSign}
            color="orange"
          />
          {/* Currency Toggle - Bottom Right */}
          <div className="absolute bottom-2 right-2 mt-1">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedCurrency('EGP')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCurrency === 'EGP'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EGP
              </button>
              <button
                onClick={() => setSelectedCurrency('SAR')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCurrency === 'SAR'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                SAR
              </button>
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
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={selectedTrend} 
                  stroke="#3F0071" 
                  strokeWidth={3}
                  name={selectedTrend.charAt(0).toUpperCase() + selectedTrend.slice(1)}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenueEGP"
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Revenue (EGP)"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenueSAR"
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Revenue (SAR)"
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
              <BarChart data={topSellingData[selectedTopSelling] || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'sales' ? 'Sales' : 'Revenue'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'subscription' ? 'bg-green-500' :
                  activity.type === 'order' ? 'bg-blue-500' :
                  activity.type === 'lead' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;

