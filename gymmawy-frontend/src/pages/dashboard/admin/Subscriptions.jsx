import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Search, Filter, Download, CreditCard, Users, MoreVertical, X, CheckCircle, Clock, TrendingUp, Package, Eye, RefreshCw, GripVertical } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import AddSubscriptionModal from '../../../components/modals/AddSubscriptionModal';
import PaymentProofModal from '../../../components/modals/PaymentProofModal';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import adminApiService from '../../../services/adminApiService';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { config } from '../../../config';

// Sortable Row Component
const SortableRow = ({ id, children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} {...props}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </td>
      {children}
    </tr>
  );
};

const AdminSubscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState('subscriptions');

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      return `${config.API_BASE_URL}${imagePath}`;
    }
    return imagePath;
  };

  // Payment proof preview button component - Updated to use PaymentProofModal
  const PaymentProofButton = ({ payment, subscription }) => {
    const proofUrl = payment?.paymentProofUrl || payment?.proofFile;
    
    if (!proofUrl) return null;

    const handleViewProof = () => {
      // Convert subscription data to payment format for the modal
      const paymentData = {
        id: payment.id,
        paymentReference: payment.paymentReference || subscription.subscriptionNumber,
        paymentProofUrl: payment.paymentProofUrl || payment.proofFile,
        amount: subscription.price,
        currency: subscription.currency,
        method: subscription.paymentMethod,
        status: payment.status || 'PENDING_VERIFICATION',
        paymentableType: payment.paymentableType || 'SUBSCRIPTION',
        paymentableId: payment.paymentableId || subscription.id,
        createdAt: payment.createdAt,
        user: subscription.user,
        subscription: subscription
      };
      
      console.log('Payment data being passed to modal:', paymentData);
      console.log('Original payment object:', payment);
      
      setSelectedPayment(paymentData);
      setShowPaymentModal(true);
    };

    return (
      <button
        onClick={handleViewProof}
        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
        title="Click to view payment proof in full preview"
      >
        <Eye className="w-3 h-3" />
        View Proof
      </button>
    );
  };
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState('EGP'); // Add currency state
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Exchange rate state for USD conversion
  const [exchangeRates, setExchangeRates] = useState({
    EGP: 0.032, // Fallback rates (ExchangeRate-API.com will update these)
    SAR: 0.27,
    AED: 0.27,
    USD: 1
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch subscription plans on mount for filter dropdown
  const fetchSubscriptions = useCallback(async() => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filterStatus !== 'all') {
params.status = filterStatus.toUpperCase();
}
      if (filterPlan !== 'all') {
params.plan = filterPlan;
}
      
      const response = await adminApiService.getSubscriptions(params);
      const subscriptionsData = response.items || response.data || response || [];
      
      // Debug: Log the raw data structure
      console.log('Raw subscription data:', subscriptionsData);
      
      // Ensure subscriptionsData is an array
      const dataArray = Array.isArray(subscriptionsData) ? subscriptionsData : [];
      
      // Map the data to include user and plan information for easier access
      const mappedData = dataArray.map(sub => {
        console.log('Processing subscription:', sub.id, 'User data:', sub.user, 'Mobile number:', sub.user?.mobileNumber, 'Payments:', sub.payments);
        
        // Get the latest payment for this subscription
        const latestPayment = sub.payments && sub.payments.length > 0 
          ? sub.payments[0] // Assuming payments are ordered by creation date
          : null;
        
        const processedData = {
          ...sub,
          userName: sub.user?.firstName && sub.user?.lastName 
            ? `${sub.user.firstName} ${sub.user.lastName}` 
            : sub.user?.email || 'N/A',
          userEmail: sub.user?.email || 'N/A',
          userMobileNumber: sub.user?.mobileNumber && sub.user.mobileNumber.trim() !== '' ? sub.user.mobileNumber : 'N/A',
          planName: sub.subscriptionPlan?.name?.en || sub.subscriptionPlan?.name || 'N/A',
          planId: sub.subscriptionPlan?.id || 'N/A',
          // Map coupon data
          couponCode: sub.coupon?.code || null,
          couponDiscount: sub.couponDiscount || null,
          couponDiscountPercentage: sub.couponDiscount || 0, // couponDiscount is the percentage
          // Map payment data
          paymentMethod: latestPayment?.method || null,
          payment: latestPayment ? {
            id: latestPayment.id,
            proofFile: latestPayment.proofFile,
            paymentProofUrl: latestPayment.paymentProofUrl,
            paymentReference: latestPayment.paymentReference,
            status: latestPayment.status,
            amount: latestPayment.amount,
            currency: latestPayment.currency,
            method: latestPayment.method,
            paymentableType: latestPayment.paymentableType,
            paymentableId: latestPayment.paymentableId,
            transactionId: latestPayment.transactionId,
            createdAt: latestPayment.createdAt,
          } : null,
        };
        
        console.log('Processed mobile number for subscription', sub.id, ':', processedData.userMobileNumber);
        return processedData;
      });
      
      setSubscriptions(Array.isArray(mappedData) ? mappedData : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlan]);

  const fetchSubscriptionStats = useCallback(async() => {
    try {
      const response = await adminApiService.getSubscriptionStats();
      setSubscriptionStats(response.stats);
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
    }
  }, []);

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
        fetchExchangeRates();
      }
    } else if (!authLoading && !user) {
      setError('Please log in to view subscriptions');
    }
  }, [activeTab, filterStatus, filterPlan, user, authLoading, fetchSubscriptions, fetchSubscriptionStats]);


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
          sub.subscriptionPlan?.name?.ar?.toLowerCase().includes(searchLower),
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
          plan.description?.en?.toLowerCase().includes(searchLower),
        );
      }

      // Apply active filter
      if (filterActive !== 'all') {
        filtered = filtered.filter(plan => 
          filterActive === 'active' ? plan.isActive : !plan.isActive,
        );
      }

      setFilteredPlans(filtered);
    }
  }, [subscriptions, subscriptionPlans, searchTerm, filterStatus, filterPlan, filterActive, activeTab]);

  const fetchSubscriptionPlans = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getSubscriptionPlans();
      // The backend returns { items: [...], total: ... }
      const plans = response.items || response.data || response || [];
      // Debug logs removed for production
      setSubscriptionPlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async(subscriptionId) => {
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

  const handleDeletePlan = async(planId) => {
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

  const handleStatusChange = async(subscriptionId, newStatus) => {
    try {
      await adminApiService.updateSubscription(subscriptionId, { status: newStatus });
      // Update local state instead of refetching
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: newStatus } : sub,
      ));
      // Refetch stats to update revenue and counts
      fetchSubscriptionStats();
    } catch (err) {
      console.error('Error updating subscription status:', err);
    }
  };


  const handleViewPaymentProof = (subscription) => {
    // Check if there's a payment associated with this subscription
    if (!subscription.payment?.id) {
      showError('No payment found for this subscription');
      return;
    }

    // Convert subscription data to payment format for the modal
    const paymentData = {
      id: subscription.payment.id,
      paymentReference: subscription.payment.paymentReference || subscription.subscriptionNumber,
      paymentProofUrl: subscription.payment.paymentProofUrl || subscription.payment.proofFile,
      amount: subscription.price,
      currency: subscription.currency,
      method: subscription.paymentMethod,
      status: subscription.payment.status || 'PENDING_VERIFICATION',
      user: subscription.user,
      subscription: subscription
    };
    
    setSelectedPayment(paymentData);
    setShowPaymentModal(true);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      await adminApiService.approvePayment(paymentId);
      
      // Refresh subscriptions data
      await fetchSubscriptions();
      await fetchSubscriptionStats();
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error('Error approving payment:', err);
      showError(`Failed to approve payment: ${err.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      console.log('Rejecting payment with ID:', paymentId);
      console.log('Selected payment data:', selectedPayment);
      
      await adminApiService.rejectPayment(paymentId);
      
      // Refresh subscriptions data
      await fetchSubscriptions();
      await fetchSubscriptionStats();
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error('Error rejecting payment:', err);
      showError(`Failed to reject payment: ${err.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
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

  const handleTogglePlanStatus = async (planId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update the local state first for immediate UI feedback
      setSubscriptionPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === planId 
            ? { ...plan, isActive: newStatus }
            : plan
        )
      );
      
      // Update the filtered plans as well
      setFilteredPlans(prevFiltered => 
        prevFiltered.map(plan => 
          plan.id === planId 
            ? { ...plan, isActive: newStatus }
            : plan
        )
      );
      
      // Then make the API call
      await adminApiService.updateSubscriptionPlan(planId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling plan status:', err);
      showError('Failed to update plan status');
      
      // Revert the optimistic update on error
      setSubscriptionPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === planId 
            ? { ...plan, isActive: currentStatus }
            : plan
        )
      );
      
      setFilteredPlans(prevFiltered => 
        prevFiltered.map(plan => 
          plan.id === planId 
            ? { ...plan, isActive: currentStatus }
            : plan
        )
      );
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filteredPlans.findIndex((item) => item.id === active.id);
      const newIndex = filteredPlans.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(filteredPlans, oldIndex, newIndex);
      
      // Update local state immediately
      setFilteredPlans(newOrder);
      setSubscriptionPlans(newOrder);

      // Update order numbers in backend - only update plans that moved
      try {
        const movedPlan = newOrder[newIndex];
        await adminApiService.updateSubscriptionPlan(movedPlan.id, { order: newIndex + 1 });
        
        // Update other plans that were affected by the move
        const affectedPlans = newOrder.slice(Math.min(oldIndex, newIndex), Math.max(oldIndex, newIndex) + 1);
        const updatePromises = affectedPlans.map((plan, index) => {
          const actualIndex = newOrder.findIndex(p => p.id === plan.id);
          return adminApiService.updateSubscriptionPlan(plan.id, { order: actualIndex + 1 });
        });
        
        await Promise.all(updatePromises);
      } catch (err) {
        console.error('Error updating plan order:', err);
        showError('Failed to update plan order');
        // Revert on error
        fetchSubscriptionPlans();
      }
    }
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

  // Calculate total revenue in USD
  const calculateTotalRevenueUSD = () => {
    if (!subscriptionStats) return 0;
    
    const currencies = ['EGP', 'SAR', 'AED', 'USD'];
    let totalUSD = 0;
    
    currencies.forEach(curr => {
      const revenue = subscriptionStats.monthlyRevenue?.[curr] || 0;
      const rate = exchangeRates[curr];
      totalUSD += revenue * rate;
    });
    
    return totalUSD;
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
          'Plan Discount': `${sub.discountPercentage || 0}%`,
          'Coupon Discount': sub.couponCode ? `${sub.couponCode} (${parseInt(sub.couponDiscount || 0)}%)` : 'No coupon',
          'Payment Method': sub.paymentMethod || 'N/A',
          'Payment Proof': (sub.paymentMethod === 'VODAFONECASH' || sub.paymentMethod === 'INSTAPAY') && sub.payment?.proofFile ? 'Yes' : 'No',
          'Created At': sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '',
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
          'Created At': plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '',
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
        }).join(','),
      ),
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
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.userName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.userEmail || 'N/A'}</div>
          {row.userMobileNumber && row.userMobileNumber !== 'N/A' && (
            <div className="text-sm text-gray-500">{row.userMobileNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'planName',
      label: 'Plan',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'isMedical',
      label: 'Medical',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
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
      ),
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
                    {row.currency === 'EGP' ? 'Egyptian Pound' : 
                     row.currency === 'SAR' ? 'Saudi Riyal' :
                     row.currency === 'AED' ? 'UAE Dirham' :
                     row.currency === 'USD' ? 'US Dollar' : row.currency}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'discountPercentage',
      label: 'Plan Discount',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {value || 0}%
        </span>
      ),
    },
    {
      key: 'couponDiscountPercentage',
      label: 'Coupon Discount',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm text-center">
          {row.couponCode ? (
            <div className="space-y-2">
              <div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  {row.couponCode}
                </span>
              </div>
              {value && parseInt(value) > 0 ? (
                <div className="font-medium text-green-600">
                  {parseInt(value)}%
                </div>
              ) : (
                <div className="text-gray-400 text-xs">No discount</div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-xs">No coupon</div>
          )}
        </div>
      ),
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
      ),
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
                if (daysLeft < 0) {
return 'Expired';
}
                if (daysLeft === 0) {
return 'Expires today';
}
                if (daysLeft === 1) {
return 'Expires tomorrow';
}
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
      ),
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
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'VODAFONE_CASH' ? 'bg-green-100 text-green-800' :
            value === 'INSTA_PAY' ? 'bg-blue-100 text-blue-800' :
            value === 'CARD' ? 'bg-purple-100 text-purple-800' :
            value === 'TABBY' ? 'bg-orange-100 text-orange-800' :
            value === 'TAMARA' ? 'bg-pink-100 text-pink-800' :
            value === 'CASH' ? 'bg-gray-100 text-gray-800' :
            value === 'STRIPE' ? 'bg-indigo-100 text-indigo-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {value || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'paymentReference',
      label: 'Payment Reference',
      sortable: false,
      render: (value, row) => {
        const paymentRef = row.payment?.paymentReference || 'N/A';
        const paymentableType = row.payment?.paymentableType;
        
        // Determine color based on paymentable type
        const getReferenceColor = (type) => {
          switch (type) {
            case 'SUBSCRIPTION':
              return 'text-blue-600';
            case 'ORDER':
              return 'text-green-600';
            case 'PROGRAMME_PURCHASE':
              return 'text-purple-600';
            case 'PACKAGE_PURCHASE':
              return 'text-orange-600';
            case 'MEMBERSHIP':
              return 'text-indigo-600';
            default:
              return 'text-gray-600';
          }
        };

        return (
          <div className="text-sm">
            <div className={`font-medium ${getReferenceColor(paymentableType)}`}>
              {paymentRef}
            </div>
            {row.payment?.transactionId && (
              <div className="text-xs text-gray-400">
                TXN: {row.payment.transactionId.substring(0, 8)}...
              </div>
            )}
          </div>
        );
      },
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
      },
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
          {(row.payment?.proofFile || row.payment?.paymentProofUrl) && (
            <PaymentProofButton payment={row.payment} subscription={row} />
          )}
        </div>
      ),
    },
  ];

  const subscriptionPlanColumns = [
    {
      key: 'name',
      label: 'Plan Name',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          {/* Plan Image */}
          <div className="w-10 h-10 flex-shrink-0">
            {row.imageUrl ? (
              <img
                src={row.imageUrl.startsWith('http') ? row.imageUrl : `${config.API_BASE_URL}${row.imageUrl}`}
                alt={value?.en || row?.name?.en || 'Plan'}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="font-medium text-gray-900">
            {value?.en || row?.name?.en || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Regular Price',
      sortable: true,
      sortFunction: (a, b, direction) => {
        const aPrice = parseFloat(a.price?.amount) || 0;
        const bPrice = parseFloat(b.price?.amount) || 0;
        return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      },
      render: (value, row) => {
        const discount = row?.discountPercentage || 0;
        const allPrices = row?.allPrices?.regular || {};
        
        if (!allPrices || Object.keys(allPrices).length === 0) {
          return <span className="text-gray-500">No price set</span>;
        }
        
        return (
          <div className="text-sm space-y-1">
            {Object.entries(allPrices).map(([currency, amount]) => {
              const originalPrice = parseFloat(amount) || 0;
              const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
              
              return (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 w-8">{currency}:</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <div>
                        <div className="font-medium text-green-600">
                          {discountedPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 line-through">
                          {originalPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="font-medium text-green-600">
                        {originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {discount > 0 && (
              <div className="text-xs text-red-600 font-medium text-center">
                -{discount}% off
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'medicalPrice',
      label: 'Medical Price',
      sortable: true,
      sortFunction: (a, b, direction) => {
        const aPrice = parseFloat(a.medicalPrice?.amount) || 0;
        const bPrice = parseFloat(b.medicalPrice?.amount) || 0;
        return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      },
      render: (value, row) => {
        const discount = row?.discountPercentage || 0;
        const allMedicalPrices = row?.allPrices?.medical || {};
        
        if (!allMedicalPrices || Object.keys(allMedicalPrices).length === 0) {
          return <span className="text-gray-500">N/A</span>;
        }
        
        return (
          <div className="text-sm space-y-1">
            {Object.entries(allMedicalPrices).map(([currency, amount]) => {
              const originalPrice = parseFloat(amount) || 0;
              const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
              
              return (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 w-8">{currency}:</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <div>
                        <div className="font-medium text-blue-600">
                          {discountedPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 line-through">
                          {originalPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="font-medium text-blue-600">
                        {originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {discount > 0 && (
              <div className="text-xs text-red-600 font-medium text-center">
                -{discount}% off
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'discount',
      label: 'Discount',
      sortable: true,
      sortFunction: (a, b, direction) => {
        const aDiscount = a.discountPercentage || 0;
        const bDiscount = b.discountPercentage || 0;
        return direction === 'asc' ? aDiscount - bDiscount : bDiscount - aDiscount;
      },
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row?.discountPercentage > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {row?.discountPercentage || 0}%
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      sortFunction: (a, b, direction) => {
        const aDuration = a.subscriptionPeriodDays || 0;
        const bDuration = b.subscriptionPeriodDays || 0;
        return direction === 'asc' ? aDuration - bDuration : bDuration - aDuration;
      },
      render: (value, row) => {
        const formatDuration = (days, isGift = false) => {
          if (!days || days === 0) {
return null;
}
          
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
      },
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
      ),
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
      ),
    },
    {
      key: 'activeSubscriptions',
      label: 'Active Subscriptions',
      sortable: true,
      sortFunction: (a, b, direction) => {
        const aCount = a._aggr_count_subscriptions || 0;
        const bCount = b._aggr_count_subscriptions || 0;
        return direction === 'asc' ? aCount - bCount : bCount - aCount;
      },
      render: (value, row) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {row?._aggr_count_subscriptions || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'benefits',
      label: 'Benefits',
      sortable: false,
      render: (value, row) => {
        const benefits = row?.benefits || [];
        // Debug logs removed for production
        if (!benefits.length) {
          return <span className="text-gray-400">No benefits</span>;
        }
        
        return (
          <div className="max-w-xs">
            <div className="text-xs text-gray-600 mb-1">
              {benefits.length} benefit{benefits.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {benefits.slice(0, 3).map((benefit, index) => {
                // Handle both old and new benefit structures
                const benefitDescription = benefit.description?.en || 
                                         benefit.benefit?.description?.en || 
                                         benefit.benefit?.description || 
                                         'Benefit';
                
                return (
                  <div key={index} className="text-xs text-gray-700 truncate">
                    • {benefitDescription}
                  </div>
                );
              })}
              {benefits.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{benefits.length - 3} more...
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <ToggleSwitch
          checked={value}
          onChange={() => handleTogglePlanStatus(row.id, value)}
        />
      ),
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
      ),
    },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Revenue Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currency} {subscriptionStats?.monthlyRevenue?.[currency]?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          {/* Currency Toggle - Attached to top of card frame */}
          <div className="absolute -top-2 right-3">
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1 shadow-sm">
              <button
                onClick={() => setCurrency('EGP')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'EGP'
                    ? 'bg-gymmawy-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                EGP
              </button>
              <button
                onClick={() => setCurrency('SAR')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'SAR'
                    ? 'bg-gymmawy-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                SAR
              </button>
              <button
                onClick={() => setCurrency('AED')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'AED'
                    ? 'bg-gymmawy-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                AED
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  currency === 'USD'
                    ? 'bg-gymmawy-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>
        
        {/* Total Revenue USD Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue (USD)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${calculateTotalRevenueUSD().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
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
          {(searchTerm || filterStatus !== 'all' || filterPlan !== 'all' || filterActive !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPlan('all');
                setFilterActive('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table with Integrated Filters */}
      {activeTab === 'subscriptions' ? (
        <TableWithFilters
          data={Array.isArray(filteredSubscriptions) ? filteredSubscriptions : []}
          columns={subscriptionColumns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search subscriptions..."
          filters={[
            {
              label: "Status",
              value: filterStatus,
              onChange: setFilterStatus,
              options: [
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "active", label: "Active" },
                { value: "expired", label: "Expired" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
            {
              label: "Plan",
              value: filterPlan,
              onChange: setFilterPlan,
              options: [
                { value: "all", label: "All Plans" },
                ...(Array.isArray(subscriptionPlans) ? subscriptionPlans.map(plan => ({
                  value: plan.id,
                  label: plan.name?.en || plan.name || 'Unnamed Plan',
                })) : []),
              ],
            },
          ]}
          onApplyFilters={fetchSubscriptions}
          onExport={handleExport}
          showApplyButton={false}
          showExportButton={true}
          applyButtonText="Apply Filters"
          exportButtonText="Export"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Standard Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="md:max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Empty divs for grid spacing */}
              <div></div>

              {/* Action Buttons */}
              <div className="flex items-end space-x-3">
                <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Drag and Drop Table */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Drag
                    </th>
                    {subscriptionPlanColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <SortableContext
                  items={filteredPlans.map(plan => plan.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlans.map((plan) => (
                      <SortableRow key={plan.id} id={plan.id}>
                        {subscriptionPlanColumns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                            {column.render ? column.render(plan[column.key], plan) : plan[column.key]}
                          </td>
                        ))}
                      </SortableRow>
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>

          {filteredPlans.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      )}

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
                  <p className="text-blue-600 font-medium">EGP {selectedPlan.medicalEGP ? parseFloat(selectedPlan.medicalEGP).toFixed(2) : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Price (SAR)</label>
                  <p className="text-blue-600 font-medium">SAR {selectedPlan.medicalSAR ? parseFloat(selectedPlan.medicalSAR).toFixed(2) : 'N/A'}</p>
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
                      if (days === 0) {
return 'None';
}
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
                    {selectedPlan.benefits.map((benefit, index) => {
                      // Handle both old and new benefit structures
                      const enDescription = benefit.description?.en || 
                                          benefit.benefit?.description?.en || 
                                          'No English description';
                      const arDescription = benefit.description?.ar || 
                                          benefit.benefit?.description?.ar || 
                                          'لا يوجد وصف بالعربية';
                      
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">
                            {enDescription}
                          </div>
                          <div className="text-sm text-gray-600" dir="rtl">
                            {arDescription}
                          </div>
                        </div>
                      );
                    })}
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

      {/* Payment Proof Modal */}
      <PaymentProofModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default AdminSubscriptions;
