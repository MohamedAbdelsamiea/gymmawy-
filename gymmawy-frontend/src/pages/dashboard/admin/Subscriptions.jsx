import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Search, Filter, Download, CreditCard, Users, MoreVertical, X, CheckCircle, Clock, TrendingUp, Package } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import AddSubscriptionModal from '../../../components/modals/AddSubscriptionModal';
import adminApiService from '../../../services/adminApiService';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const AdminSubscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState('EGP'); // Add currency state
  const [subscriptionStats, setSubscriptionStats] = useState(null);

  // Fetch subscription plans on mount for filter dropdown
  useEffect(() => {
    if (!authLoading && user) {
      fetchSubscriptionPlans();
    }
  }, [user, authLoading]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (!authLoading && user) {
      if (activeTab === 'subscriptions') {
        fetchSubscriptions();
        fetchSubscriptionStats();
      }
    } else if (!authLoading && !user) {
      setError('Please log in to view subscriptions');
    }
  }, [activeTab, filterStatus, filterPlan, user, authLoading]);


  // Client-side filtering effect
  useEffect(() => {
    if (activeTab === 'subscriptions') {
      let filtered = [...subscriptions];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(sub => 
          sub.subscriptionNumber?.toLowerCase().includes(searchLower) ||
          sub.userName?.toLowerCase().includes(searchLower) ||
          sub.userEmail?.toLowerCase().includes(searchLower) ||
          sub.planName?.toLowerCase().includes(searchLower) ||
          sub.user?.firstName?.toLowerCase().includes(searchLower) ||
          sub.user?.lastName?.toLowerCase().includes(searchLower) ||
          sub.user?.email?.toLowerCase().includes(searchLower) ||
          sub.subscriptionPlan?.name?.en?.toLowerCase().includes(searchLower) ||
          sub.subscriptionPlan?.name?.ar?.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(sub => sub.status === filterStatus.toUpperCase());
      }

      // Apply plan filter
      if (filterPlan !== 'all') {
        filtered = filtered.filter(sub => sub.subscriptionPlanId === filterPlan || sub.planId === filterPlan);
      }

      setFilteredSubscriptions(filtered);
    } else {
      let filtered = [...subscriptionPlans];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(plan => 
          plan.name?.en?.toLowerCase().includes(searchLower) ||
          plan.description?.en?.toLowerCase().includes(searchLower)
        );
      }

      setFilteredPlans(filtered);
    }
  }, [subscriptions, subscriptionPlans, searchTerm, filterStatus, filterPlan, activeTab]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus.toUpperCase();
      if (filterPlan !== 'all') params.plan = filterPlan;
      
      const response = await adminApiService.getSubscriptions(params);
      const subscriptionsData = response.items || response.data || response || [];
      
      // Debug: Log the raw data structure
      console.log('Raw subscription data:', subscriptionsData[0]);
      
      // Map the data to include user and plan information for easier access
      const mappedData = subscriptionsData.map(sub => {
        console.log('Processing subscription:', sub.id, 'User data:', sub.user);
        return {
          ...sub,
          userName: sub.user?.firstName && sub.user?.lastName 
            ? `${sub.user.firstName} ${sub.user.lastName}` 
            : sub.user?.email || 'N/A',
          userEmail: sub.user?.email || 'N/A',
          planName: sub.subscriptionPlan?.name?.en || sub.subscriptionPlan?.name || 'N/A',
          planId: sub.subscriptionPlan?.id || 'N/A'
        };
      });
      
      setSubscriptions(Array.isArray(mappedData) ? mappedData : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getSubscriptionPlans();
      // The backend returns { items: [...], total: ... }
      const plans = response.items || response.data || response || [];
      setSubscriptionPlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      const response = await adminApiService.getSubscriptionStats();
      setSubscriptionStats(response.stats);
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        setError(null); // Clear any previous errors
        await adminApiService.cancelSubscription(subscriptionId);
        fetchSubscriptions();
        // Refetch stats to update revenue and counts
        fetchSubscriptionStats();
        // Show success message
        setError('✅ Subscription cancelled successfully!');
        setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      } catch (err) {
        console.error('Error cancelling subscription:', err);
        // Display the specific error message from the server
        setError(err.message || 'Failed to cancel subscription. Please try again.');
      }
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        setError(null); // Clear any previous errors
        await adminApiService.deleteSubscriptionPlan(planId);
        fetchSubscriptionPlans();
        // No success message - silent deletion
      } catch (err) {
        console.error('Error deleting subscription plan:', err);
        // Show error via toast
        showError(err.message || 'Failed to delete subscription plan. Please try again.');
      }
    }
  };

  const handleStatusChange = async (subscriptionId, newStatus) => {
    try {
      await adminApiService.updateSubscription(subscriptionId, { status: newStatus });
      // Update local state instead of refetching
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
      ));
      // Refetch stats to update revenue and counts
      fetchSubscriptionStats();
    } catch (err) {
      console.error('Error updating subscription status:', err);
    }
  };

  const handleActivateSubscription = async (subscriptionId) => {
    try {
      const response = await adminApiService.updateSubscription(subscriptionId, { status: 'ACTIVE' });
      // Update local state with the full response data including dates
      if (response.subscription) {
        setSubscriptions(prev => prev.map(sub => 
          sub.id === subscriptionId ? { 
            ...sub, 
            status: response.subscription.status,
            startDate: response.subscription.startDate,
            endDate: response.subscription.endDate
          } : sub
        ));
      } else {
        // Fallback: just update status and refetch to get dates
        setSubscriptions(prev => prev.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: 'ACTIVE' } : sub
        ));
        // Refetch to get the updated dates
        fetchSubscriptions();
      }
      // Refetch stats to update revenue and counts
      fetchSubscriptionStats();
    } catch (err) {
      console.error('Error activating subscription:', err);
    }
  };

  const handleAddSuccess = () => {
    if (activeTab === 'plans') {
      fetchSubscriptionPlans();
    }
  };


  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPlan(null);
    fetchSubscriptionPlans();
  };

  const handleExport = () => {
    try {
      if (activeTab === 'subscriptions') {
        // Export subscriptions data
        const dataToExport = filteredSubscriptions.map(sub => ({
          'Subscription ID': sub.id || '',
          'Customer Name': sub.userName || '',
          'Customer Email': sub.userEmail || '',
          'Plan Name': sub.planName || '',
          'Status': sub.status || '',
          'Start Date': sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'Not started',
          'Expiry Date': sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Not set',
          'Price': sub.price ? `${sub.price} ${sub.currency || 'EGP'}` : 'N/A',
          'Payment Method': sub.paymentMethod || 'N/A',
          'Payment Proof': (sub.paymentMethod === 'VODAFONECASH' || sub.paymentMethod === 'INSTAPAY') && sub.payment?.proofFile ? 'Yes' : 'No',
          'Created At': sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : ''
        }));

        exportToCSV(dataToExport, 'subscriptions');
      } else {
        // Export subscription plans data
        const dataToExport = filteredPlans.map(plan => ({
          'Plan ID': plan.id || '',
          'Name': plan.name?.en || plan.name || '',
          'Description': plan.description?.en || plan.description || '',
          'Price': plan.price || 0,
          'Duration': plan.duration || '',
          'Features': plan.features ? plan.features.join(', ') : '',
          'Status': plan.status || '',
          'Created At': plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : ''
        }));

        exportToCSV(dataToExport, 'subscription_plans');
      }
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subscriptionColumns = [
    {
      key: 'subscriptionNumber',
      label: 'Subscription Number',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gymmawy-primary font-semibold">{value}</div>
          <div className="text-xs text-gray-500">ID: {row.id}</div>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.userName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.userEmail || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'planName',
      label: 'Plan',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'medical',
      label: 'Medical',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          value === 'CANCELLED' ? 'bg-red-100 text-red-800' :
          value === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Unknown'}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        const originalPrice = row.subscriptionPlan?.priceEGP || row.subscriptionPlan?.priceSAR || row.price;
        const discount = row.discount || 0;
        const discountedPrice = originalPrice && discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
        
        return (
          <div className="text-sm">
            {discount > 0 ? (
              <div>
                <div className="font-medium text-green-600">
                  {discountedPrice ? `${discountedPrice.toFixed(2)} ${row.currency || 'EGP'}` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 line-through">
                  {originalPrice ? `${originalPrice} ${row.currency || 'EGP'}` : ''}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  -{discount}% off
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-green-600">
                  {row.price ? `${row.price} ${row.currency || 'EGP'}` : 'N/A'}
                </div>
                {row.currency && (
                  <div className="text-xs text-gray-500">
                    {row.currency === 'EGP' ? 'Egyptian Pound' : 'Saudi Riyal'}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'discount',
      label: 'Discount',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {value || 0}%
        </span>
      )
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <div className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? new Date(value).toLocaleDateString() : 'Not started'}
          </div>
          {value && (
            <div className="text-xs text-gray-500">
              {Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago'}
            </div>
          )}
          {!value && row.status === 'PENDING' && (
            <div className="text-xs text-yellow-600">
              Will start when activated
            </div>
          )}
        </div>
      )
    },
    {
      key: 'endDate',
      label: 'Expiry Date',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <div className={value ? (new Date(value) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900') : 'text-gray-400'}>
            {value ? new Date(value).toLocaleDateString() : 'Not set'}
          </div>
          {value && (
            <div className={`text-xs ${new Date(value) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
              {(() => {
                const daysLeft = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) return 'Expired';
                if (daysLeft === 0) return 'Expires today';
                if (daysLeft === 1) return 'Expires tomorrow';
                return `${daysLeft} days left`;
              })()}
            </div>
          )}
          {!value && row.status === 'PENDING' && (
            <div className="text-xs text-yellow-600">
              Will be set when activated
            </div>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <div>{value ? new Date(value).toLocaleDateString() : 'N/A'}</div>
          <div className="text-xs text-gray-500">
            {value ? Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago' : ''}
          </div>
        </div>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'VODAFONECASH' ? 'bg-green-100 text-green-800' :
            value === 'INSTAPAY' ? 'bg-blue-100 text-blue-800' :
            value === 'CARD' ? 'bg-purple-100 text-purple-800' :
            value === 'TABBY' ? 'bg-orange-100 text-orange-800' :
            value === 'TAMARA' ? 'bg-pink-100 text-pink-800' :
            value === 'CASH' ? 'bg-gray-100 text-gray-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {value || 'N/A'}
          </span>
          {row.payment?.proofFile && (value === 'VODAFONECASH' || value === 'INSTAPAY') && (
            <div className="mt-1 flex justify-center">
              <button
                onClick={() => window.open(row.payment.proofFile, '_blank')}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                title="Click to view payment proof in new tab"
              >
                View Proof
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'processedAt',
      label: 'Processed At',
      sortable: true,
      render: (value, row) => {
        // Processed at could be when status changed to ACTIVE, or when payment was processed
        const processedDate = row.startDate || row.updatedAt || row.createdAt;
        return (
          <div className="text-sm">
            <div className={processedDate ? 'text-gray-900' : 'text-gray-400'}>
              {processedDate ? new Date(processedDate).toLocaleDateString() : 'Not processed'}
            </div>
            {processedDate && (
              <div className="text-xs text-gray-500">
                {Math.floor((Date.now() - new Date(processedDate).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago'}
              </div>
            )}
            {!processedDate && row.status === 'PENDING' && (
              <div className="text-xs text-yellow-600">
                Awaiting processing
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {row.status === 'PENDING' && 
           ((row.paymentMethod === 'VODAFONECASH' || row.paymentMethod === 'INSTAPAY') ? row.payment?.proofFile : true) && (
            <button
              onClick={() => handleActivateSubscription(row.id)}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              title="Activate Subscription"
            >
              Activate
            </button>
          )}
        </div>
      )
    }
  ];

  const subscriptionPlanColumns = [
    {
      key: 'name',
      label: 'Plan Name',
      sortable: true,
      render: (value, row) => (
        <div className="font-medium text-gray-900">
          {value?.en || row?.name?.en || 'N/A'}
        </div>
      )
    },
    {
      key: 'price',
      label: 'Regular Price',
      sortable: true,
      render: (value, row) => {
        const discount = row?.discountPercentage || 0;
        const priceEGP = row?.priceEGP || 0;
        const priceSAR = row?.priceSAR || 0;
        const discountedEGP = discount > 0 ? priceEGP * (1 - discount / 100) : priceEGP;
        const discountedSAR = discount > 0 ? priceSAR * (1 - discount / 100) : priceSAR;
        
        return (
          <div className="text-sm">
            {discount > 0 ? (
              <div>
                <div className="font-medium text-green-600">EGP {discountedEGP.toFixed(2)}</div>
                <div className="text-gray-500">SAR {discountedSAR.toFixed(2)}</div>
                <div className="text-xs text-gray-500 line-through">
                  EGP {priceEGP} | SAR {priceSAR}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  -{discount}% off
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-green-600">EGP {priceEGP}</div>
                <div className="text-gray-500">SAR {priceSAR}</div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'medicalPrice',
      label: 'Medical Price',
      sortable: true,
      render: (value, row) => {
        const discount = row?.discountPercentage || 0;
        const medicalEGP = row?.medicalEGP || 0;
        const medicalSAR = row?.medicalSAR || 0;
        const discountedMedicalEGP = discount > 0 && medicalEGP > 0 ? medicalEGP * (1 - discount / 100) : medicalEGP;
        const discountedMedicalSAR = discount > 0 && medicalSAR > 0 ? medicalSAR * (1 - discount / 100) : medicalSAR;
        
        if (!medicalEGP && !medicalSAR) {
          return <span className="text-gray-500">N/A</span>;
        }
        
        return (
          <div className="text-sm">
            {discount > 0 ? (
              <div>
                <div className="font-medium text-blue-600">EGP {discountedMedicalEGP.toFixed(2)}</div>
                <div className="text-gray-500">SAR {discountedMedicalSAR.toFixed(2)}</div>
                <div className="text-xs text-gray-500 line-through">
                  EGP {medicalEGP} | SAR {medicalSAR}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  -{discount}% off
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-blue-600">EGP {medicalEGP}</div>
                <div className="text-gray-500">SAR {medicalSAR}</div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'discount',
      label: 'Discount',
      sortable: true,
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row?.discountPercentage > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {row?.discountPercentage || 0}%
        </span>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value, row) => {
        const formatDuration = (days, isGift = false) => {
          if (!days || days === 0) return null;
          
          if (days >= 30 && days % 30 === 0) {
            const months = days / 30;
            return `${months} month${months > 1 ? 's' : ''}`;
          } else if (days >= 7 && days % 7 === 0) {
            const weeks = days / 7;
            return `${weeks} week${weeks > 1 ? 's' : ''}`;
          } else {
            return `${days} day${days > 1 ? 's' : ''}`;
          }
        };

        const mainDuration = formatDuration(row?.subscriptionPeriodDays);
        const giftDuration = formatDuration(row?.giftPeriodDays, true);

        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {mainDuration || 'N/A'}
            </div>
            {giftDuration && (
              <div className="text-xs text-green-600">
                +{giftDuration} gift
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'loyaltyPoints',
      label: 'Regular Loyalty Points',
      sortable: false,
      render: (value, row) => (
        <div className="text-sm">
          {row?.loyaltyPointsAwarded > 0 || row?.loyaltyPointsRequired > 0 ? (
            <div>
              <div className="text-green-600">Award: {row.loyaltyPointsAwarded || 0}</div>
              <div className="text-orange-600">Required: {row.loyaltyPointsRequired || 0}</div>
            </div>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      )
    },
    {
      key: 'medicalLoyaltyPoints',
      label: 'Medical Loyalty Points',
      sortable: false,
      render: (value, row) => (
        <div className="text-sm">
          {row?.medicalLoyaltyPointsAwarded > 0 || row?.medicalLoyaltyPointsRequired > 0 ? (
            <div>
              <div className="text-blue-600">Award: {row.medicalLoyaltyPointsAwarded || 0}</div>
              <div className="text-purple-600">Required: {row.medicalLoyaltyPointsRequired || 0}</div>
            </div>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      )
    },
    {
      key: 'activeSubscriptions',
      label: 'Active Subscriptions',
      sortable: true,
      render: (value, row) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {row?._aggr_count_subscriptions || 0}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditPlan(row)}
            className="text-green-600 hover:text-green-800 p-1"
            title="Edit plan"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeletePlan(row.id)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete plan"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Show loading if authentication is in progress
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please log in to view subscriptions</p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchSubscriptions}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          error.includes('successfully') || error.includes('✅')
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions Management</h1>
          <p className="text-gray-600 mt-1">Manage subscription plans and customer subscriptions</p>
        </div>
        {activeTab === 'plans' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
          >
          <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </button>
        )}
      </div>

      {/* Stats Cards - Always visible, no re-rendering */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStats?.totalSubscriptions || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStats?.activeSubscriptions || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStats?.pendingSubscriptions || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currency === 'EGP' ? 'EGP' : 'SAR'} {subscriptionStats?.monthlyRevenue?.[currency]?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          {/* Currency Toggle - Bottom Right */}
          <div className="absolute bottom-2 right-2 mt-1">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setCurrency('EGP')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'EGP'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EGP
              </button>
              <button
                onClick={() => setCurrency('SAR')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'SAR'
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Subscription Plans
        </button>
        </nav>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">
              {activeTab === 'subscriptions' ? filteredSubscriptions.length : filteredPlans.length}
            </span> of <span className="font-medium text-gray-900">
              {activeTab === 'subscriptions' ? subscriptions.length : subscriptionPlans.length}
            </span> {activeTab === 'subscriptions' ? 'subscriptions' : 'plans'}
          </div>
          {(searchTerm || filterStatus !== 'all' || filterPlan !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPlan('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table with Integrated Filters */}
      <TableWithFilters
        data={activeTab === 'subscriptions' ? (Array.isArray(filteredSubscriptions) ? filteredSubscriptions : []) : (Array.isArray(filteredPlans) ? filteredPlans : [])}
        columns={activeTab === 'subscriptions' ? subscriptionColumns : subscriptionPlanColumns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={activeTab === 'subscriptions' ? "Search subscriptions..." : "Search plans..."}
        filters={activeTab === 'subscriptions' ? [
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
              { value: "cancelled", label: "Cancelled" }
            ]
          },
          {
            label: "Plan",
            value: filterPlan,
            onChange: setFilterPlan,
            options: [
              { value: "all", label: "All Plans" },
              ...(Array.isArray(subscriptionPlans) ? subscriptionPlans.map(plan => ({
                value: plan.id,
                label: plan.name?.en || plan.name || 'Unnamed Plan'
              })) : [])
            ]
          }
        ] : []}
        onApplyFilters={activeTab === 'subscriptions' ? fetchSubscriptions : fetchSubscriptionPlans}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        applyButtonText="Apply Filters"
        exportButtonText="Export"
      />

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* View Plan Modal */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Plan Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name (English)</label>
                  <p className="text-gray-900">{selectedPlan.name?.en || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name (Arabic)</label>
                  <p className="text-gray-900" dir="rtl">{selectedPlan.name?.ar || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                  <p className="text-gray-900">{selectedPlan.description?.en || 'No description'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                  <p className="text-gray-900" dir="rtl">{selectedPlan.description?.ar || 'لا يوجد وصف'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price (EGP)</label>
                  <p className="text-green-600 font-medium">EGP {selectedPlan.priceEGP || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price (SAR)</label>
                  <p className="text-green-600 font-medium">SAR {selectedPlan.priceSAR || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Price (EGP)</label>
                  <p className="text-blue-600 font-medium">EGP {selectedPlan.medicalEGP || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Price (SAR)</label>
                  <p className="text-blue-600 font-medium">SAR {selectedPlan.medicalSAR || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                  <p className="text-gray-900">{selectedPlan.discountPercentage || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-gray-900">
                    {(() => {
                      const days = selectedPlan.subscriptionPeriodDays || 0;
                      if (days >= 30 && days % 30 === 0) {
                        const months = days / 30;
                        return `${months} month${months > 1 ? 's' : ''}`;
                      } else if (days >= 7 && days % 7 === 0) {
                        const weeks = days / 7;
                        return `${weeks} week${weeks > 1 ? 's' : ''}`;
                      } else {
                        return `${days} day${days > 1 ? 's' : ''}`;
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gift Period</label>
                  <p className="text-gray-900">
                    {(() => {
                      const days = selectedPlan.giftPeriodDays || 0;
                      if (days === 0) return 'None';
                      if (days >= 30 && days % 30 === 0) {
                        const months = days / 30;
                        return `${months} month${months > 1 ? 's' : ''}`;
                      } else if (days >= 7 && days % 7 === 0) {
                        const weeks = days / 7;
                        return `${weeks} week${weeks > 1 ? 's' : ''}`;
                      } else {
                        return `${days} day${days > 1 ? 's' : ''}`;
                      }
                    })()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Loyalty Points Awarded</label>
                  <p className="text-green-600">{selectedPlan.loyaltyPointsAwarded || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Loyalty Points Required</label>
                  <p className="text-orange-600">{selectedPlan.loyaltyPointsRequired || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Loyalty Points Awarded</label>
                  <p className="text-blue-600">{selectedPlan.medicalLoyaltyPointsAwarded || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Loyalty Points Required</label>
                  <p className="text-purple-600">{selectedPlan.medicalLoyaltyPointsRequired || 0}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                {selectedPlan.benefits && selectedPlan.benefits.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPlan.benefits.map((benefit, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900">
                          {benefit.benefit?.description?.en || 'No English description'}
                        </div>
                        <div className="text-sm text-gray-600" dir="rtl">
                          {benefit.benefit?.description?.ar || 'لا يوجد وصف بالعربية'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No benefits</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-gray-900">
                    {selectedPlan.createdAt ? new Date(selectedPlan.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                  <p className="text-gray-900">
                    {selectedPlan.updatedAt ? new Date(selectedPlan.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      <AddSubscriptionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        editData={selectedPlan}
        isEdit={true}
      />
    </div>
  );
};

export default AdminSubscriptions;
