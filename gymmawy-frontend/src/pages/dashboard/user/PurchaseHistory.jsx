import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Package, CreditCard, Play, ArrowRight, Plus } from 'lucide-react';
import { StatusBadge } from '../../../components/dashboard';
import programmeService from '../../../services/programmeService';
import subscriptionService from '../../../services/subscriptionService';

const UserDashboard = () => {
  const { t } = useTranslation("dashboard");
  const [programmes, setProgrammes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async() => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's programmes and subscriptions in parallel
      const [programmesData, subscriptionsData] = await Promise.allSettled([
        programmeService.getUserProgrammes(),
        subscriptionService.getUserSubscriptions(),
      ]);
      
      setProgrammes(programmesData.status === 'fulfilled' ? (programmesData.value.items || []) : []);
      setSubscriptions(subscriptionsData.status === 'fulfilled' ? (subscriptionsData.value.items || []) : []);
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
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your programmes, subscriptions, and profile</p>
      </div>

      {/* Programmes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Play className="h-6 w-6 text-gymmawy-primary mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">My Programmes</h2>
          </div>
          <Link 
            to="/programmes" 
            className="flex items-center text-gymmawy-primary hover:text-gymmawy-primary-dark font-medium"
          >
            View All Programmes
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {programmes.length > 0 ? (
          <div className="space-y-4">
            {programmes.slice(0, 3).map((programme) => (
              <div key={programme.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Play className="h-5 w-5 text-gymmawy-primary mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{programme.programme?.name || 'Unknown Programme'}</h3>
                    <p className="text-sm text-gray-500">
                      Purchased on {new Date(programme.purchasedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-green-600">
                    ${programme.price?.toFixed(2) || '0.00'}
                  </span>
                  <StatusBadge status={programme.status} />
                </div>
              </div>
            ))}
            {programmes.length > 3 && (
              <div className="text-center">
                <Link 
                  to="/programmes" 
                  className="text-gymmawy-primary hover:text-gymmawy-primary-dark font-medium"
                >
                  View {programmes.length - 3} more programmes
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Programmes Yet</h3>
            <p className="text-gray-500 mb-4">Start your fitness journey with our amazing programmes</p>
            <Link 
              to="/programmes" 
              className="inline-flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-primary-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Programmes
            </Link>
          </div>
        )}
      </div>

      {/* Subscriptions Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-gymmawy-primary mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">My Subscriptions</h2>
          </div>
          <Link 
            to="/packages" 
            className="flex items-center text-gymmawy-primary hover:text-gymmawy-primary-dark font-medium"
          >
            View All Packages
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.slice(0, 3).map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gymmawy-primary mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{subscription.subscriptionPlan?.name || 'Unknown Plan'}</h3>
                    <p className="text-sm text-gray-500">
                      {subscription.startDate ? `Started ${new Date(subscription.startDate).toLocaleDateString()}` : 'Not started yet'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-green-600">
                    ${subscription.price?.toFixed(2) || '0.00'}
                  </span>
                  <StatusBadge status={subscription.status} />
                </div>
              </div>
            ))}
            {subscriptions.length > 3 && (
              <div className="text-center">
                <Link 
                  to="/packages" 
                  className="text-gymmawy-primary hover:text-gymmawy-primary-dark font-medium"
                >
                  View {subscriptions.length - 3} more subscriptions
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscriptions Yet</h3>
            <p className="text-gray-500 mb-4">Choose a subscription plan that fits your fitness goals</p>
            <Link 
              to="/packages" 
              className="inline-flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-primary-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Packages
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};

export default UserDashboard;