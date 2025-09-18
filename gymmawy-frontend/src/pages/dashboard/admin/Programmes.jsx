import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Search, Filter, Download, CreditCard, Users, MoreVertical, X, Play, ShoppingBag, Clock, TrendingUp, RefreshCw, Package, GripVertical, Eye } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import AddProgrammeModal from '../../../components/modals/AddProgrammeModal';
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

// Sortable row component for programmes
const SortableProgrammeRow = ({ programme, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: programme.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <button
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
      {children}
    </tr>
  );
};

const AdminProgrammes = () => {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState('programmes');

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      return `${config.API_BASE_URL}${imagePath}`;
    }
    return imagePath;
  };
  const [programmes, setProgrammes] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [currency, setCurrency] = useState('EGP');
  const [programmeStats, setProgrammeStats] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment proof preview button component - Updated to use PaymentProofModal
  const PaymentProofButton = ({ payment, purchase }) => {
    const proofUrl = payment?.paymentProofUrl || payment?.proofFile;
    
    if (!proofUrl) return null;

    const handleViewProof = () => {
      // Convert purchase data to payment format for the modal
      const paymentData = {
        id: payment.id,
        paymentReference: payment.paymentReference || purchase.purchaseNumber,
        paymentProofUrl: payment.paymentProofUrl || payment.proofFile,
        amount: purchase.price,
        currency: purchase.currency,
        method: payment.method,
        status: payment.status || 'PENDING_VERIFICATION',
        paymentableType: payment.paymentableType || 'PROGRAMME_PURCHASE',
        paymentableId: payment.paymentableId || purchase.id,
        createdAt: payment.createdAt,
        user: purchase.user,
        programme: purchase.programme
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

  // Fetch programmes on mount for filter dropdown
  useEffect(() => {
    if (!authLoading && user) {
      fetchProgrammes();
    }
  }, [user, authLoading]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (!authLoading && user) {
      if (activeTab === 'programmes') {
        fetchProgrammes();
        fetchProgrammeStats();
        fetchExchangeRates();
      } else if (activeTab === 'purchases') {
        fetchPurchases();
        fetchProgrammeStats();
        fetchExchangeRates();
      }
    } else if (!authLoading && !user) {
      setError('Please log in to view programmes');
    }
  }, [activeTab, filterProgramme, filterStatus, user, authLoading]);

  // Client-side filtering effect
  useEffect(() => {
    if (activeTab === 'programmes') {
      let filtered = [...programmes];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(programme => 
          programme.id?.toString().includes(searchLower) ||
          programme.name?.en?.toLowerCase().includes(searchLower) ||
          programme.name?.ar?.toLowerCase().includes(searchLower) ||
          programme.description?.en?.toLowerCase().includes(searchLower) ||
          programme.description?.ar?.toLowerCase().includes(searchLower),
        );
      }

      // Apply programme filter
      if (filterProgramme !== 'all') {
        filtered = filtered.filter(programme => programme.id === filterProgramme);
      }

      setFilteredProgrammes(filtered);
    } else if (activeTab === 'purchases') {
      let filtered = [...purchases];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(purchase => 
          purchase.purchaseNumber?.toLowerCase().includes(searchLower) ||
          purchase.userName?.toLowerCase().includes(searchLower) ||
          purchase.userEmail?.toLowerCase().includes(searchLower) ||
          purchase.programmeName?.toLowerCase().includes(searchLower),
        );
      }

      // Apply programme filter
      if (filterProgramme !== 'all') {
        filtered = filtered.filter(purchase => purchase.programmeId === filterProgramme);
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(purchase => purchase.status === filterStatus);
      }

      setFilteredPurchases(filtered);
    }
  }, [searchTerm, filterProgramme, filterStatus, programmes, purchases, activeTab]);

  const fetchProgrammes = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getProgrammes();
      const programmesData = response.programmes?.items || response.items || response.data || response || [];
      
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
    } catch (err) {
      console.error('Error fetching programmes:', err);
      setError('Failed to fetch programmes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getProgrammePurchases();
      const purchasesData = response.purchases?.items || response.items || response.data || response || [];
      
      // Map the data to include user and programme information for easier access
      const mappedData = purchasesData.map(purchase => ({
        ...purchase,
        userName: purchase.user?.firstName && purchase.user?.lastName 
          ? `${purchase.user.firstName} ${purchase.user.lastName}` 
          : purchase.user?.email || 'N/A',
        userEmail: purchase.user?.email || 'N/A',
        programmeName: purchase.programme?.name?.en || purchase.programme?.name || 'N/A',
        programmeId: purchase.programme?.id || 'N/A',
        // Map coupon information - keep original couponDiscount field from backend
        couponDiscount: purchase.couponDiscount || 0,
        // Map payment information (get the latest payment)
        payment: purchase.payments && purchase.payments.length > 0 ? purchase.payments[0] : null,
      }));
      
      setPurchases(Array.isArray(mappedData) ? mappedData : []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammeStats = async() => {
    try {
      const response = await adminApiService.getProgrammeStats();
      setProgrammeStats(response.stats);
    } catch (err) {
      console.error('Error fetching programme stats:', err);
    }
  };

  const handleDeleteProgramme = async(programmeId) => {
    if (window.confirm('Are you sure you want to delete this programme?')) {
      try {
        await adminApiService.deleteProgramme(programmeId);
        fetchProgrammes();
        fetchProgrammeStats();
      } catch (err) {
        console.error('Error deleting programme:', err);
      }
    }
  };

  const handleUpdatePurchaseStatus = async(purchaseId, newStatus) => {
    const action = newStatus === 'COMPLETE' ? 'approve' : 'revert to pending';
    if (window.confirm(`Are you sure you want to ${action} this purchase?`)) {
      try {
        await adminApiService.updateProgrammePurchase(purchaseId, { status: newStatus });
        fetchPurchases();
        fetchProgrammeStats();
      } catch (err) {
        console.error('Error updating purchase status:', err);
        alert('Failed to update purchase status. Please try again.');
      }
    }
  };

  const handleStatusChange = async(purchaseId, newStatus) => {
    try {
      await adminApiService.updateProgrammePurchase(purchaseId, { status: newStatus });
      // Update local state instead of refetching
      setPurchases(prev => prev.map(purchase => 
        purchase.id === purchaseId ? { ...purchase, status: newStatus } : purchase,
      ));
      // Refetch stats to update revenue and counts
      fetchProgrammeStats();
    } catch (err) {
      console.error('Error updating purchase status:', err);
      alert('Failed to update purchase status. Please try again.');
    }
  };

  const handleViewPaymentProof = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      await adminApiService.approvePayment(paymentId);
      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchPurchases(); // Refresh the list
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Failed to approve payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      await adminApiService.rejectPayment(paymentId);
      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchPurchases(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSuccess = () => {
    if (activeTab === 'programmes') {
      fetchProgrammes();
    }
    fetchProgrammeStats();
  };

  const handleEditProgramme = (programme) => {
    setSelectedProgramme(programme);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedProgramme(null);
    fetchProgrammes();
    fetchProgrammeStats();
  };

  const handleToggleProgrammeStatus = async (programmeId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update the local state first for immediate UI feedback
      setProgrammes(prevProgrammes => 
        prevProgrammes.map(programme => 
          programme.id === programmeId 
            ? { ...programme, isActive: newStatus }
            : programme
        )
      );
      
      // Update the filtered programmes as well
      setFilteredProgrammes(prevFilteredProgrammes => 
        prevFilteredProgrammes.map(programme => 
          programme.id === programmeId 
            ? { ...programme, isActive: newStatus }
            : programme
        )
      );
      
      // Then make the API call
      await adminApiService.updateProgramme(programmeId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling programme status:', err);
      showError('Failed to update programme status');
      
      // Revert the optimistic update on error
      setProgrammes(prevProgrammes => 
        prevProgrammes.map(programme => 
          programme.id === programmeId 
            ? { ...programme, isActive: currentStatus }
            : programme
        )
      );
      
      setFilteredProgrammes(prevFilteredProgrammes => 
        prevFilteredProgrammes.map(programme => 
          programme.id === programmeId 
            ? { ...programme, isActive: currentStatus }
            : programme
        )
      );
    }
  };

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = programmes.findIndex((item) => item.id === active.id);
      const newIndex = programmes.findIndex((item) => item.id === over.id);

      const newProgrammes = arrayMove(programmes, oldIndex, newIndex);
      
      // Optimistically update the local state
      setProgrammes(newProgrammes);
      setFilteredProgrammes(newProgrammes);

      try {
        // Send the new order to the backend
        await adminApiService.updateProgrammeOrder(newProgrammes);
      } catch (error) {
        console.error('Error updating programme order:', error);
        showError('Failed to update programme order');
        
        // Revert on error
        fetchProgrammes();
      }
    }
  }, [programmes, showError]);

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
    if (!programmeStats) return 0;
    
    const currencies = ['EGP', 'SAR', 'AED', 'USD'];
    let totalUSD = 0;
    
    currencies.forEach(curr => {
      const revenue = programmeStats.monthlyRevenue?.[curr] || 0;
      const rate = exchangeRates[curr];
      totalUSD += revenue * rate;
    });
    
    return totalUSD;
  };

  const handleExport = () => {
    try {
      if (activeTab === 'programmes') {
        // Export programmes data
        const dataToExport = filteredProgrammes.map(programme => ({
          'Name (EN)': programme.name?.en || '',
          'Name (AR)': programme.name?.ar || '',
          'Description (EN)': programme.description?.en || '',
          'Description (AR)': programme.description?.ar || '',
          'Price EGP': programme.priceEGP || 0,
          'Price SAR': programme.priceSAR || 0,
          'Discount': programme.discount || 0,
          'Loyalty Points Awarded': programme.loyaltyPointsAwarded || 0,
          'Loyalty Points Required': programme.loyaltyPointsRequired || 0,
          'Purchases': programme._count?.purchases || 0,
          'Created At': programme.createdAt ? new Date(programme.createdAt).toLocaleDateString() : '',
        }));

        exportToCSV(dataToExport, 'programmes');
      } else {
        // Export purchases data
        const dataToExport = filteredPurchases.map(purchase => ({
          'Customer Email': purchase.userEmail || '',
          'Programme Name': purchase.programmeName || '',
          'Price': purchase.price ? `${purchase.currency || 'EGP'} ${purchase.price}` : 'N/A',
          'Discount': purchase.discount || 0,
          'Purchased At': purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : '',
        }));

        exportToCSV(dataToExport, 'programme-purchases');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const programmeColumns = [
    {
      key: 'name',
      label: 'Programme Name',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          {/* Programme Image */}
          <div className="w-10 h-10 flex-shrink-0">
            {row.imageUrl ? (
              <img
                src={getImageUrl(row.imageUrl)}
                alt={value?.en || row?.name?.en || 'Programme'}
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
          <div>
            <div className="font-medium text-gray-900">{value?.en || 'N/A'}</div>
            <div className="text-sm text-gray-500" dir="rtl">{value?.ar || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'prices',
      label: 'Prices',
      sortable: false,
      render: (value, row) => {
        const discount = row.discountPercentage || 0;
        const prices = row.prices || [];
        
        // Create a map of currency to price
        const priceMap = {};
        prices.forEach(price => {
          priceMap[price.currency] = Number(price.amount);
        });
        
        const currencies = ['EGP', 'SAR', 'AED', 'USD'];
        
        return (
          <div className="text-sm space-y-1">
            {currencies.map(currency => {
              const amount = priceMap[currency];
              if (!amount) return null;
              
              const discountedAmount = discount > 0 ? amount * (1 - discount / 100) : amount;
              
              return (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-gray-600">{currency}:</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <div>
                        <div className="font-medium text-green-600">{Number(discountedAmount).toFixed(2)}</div>
                        <div className="text-xs text-gray-500 line-through">{Number(amount).toFixed(2)}</div>
                      </div>
                    ) : (
                      <div className="font-medium text-green-600">{Number(amount).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'discount',
      label: 'Discount',
      sortable: false,
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
      key: 'loyaltyReward',
      label: 'Loyalty Reward',
      sortable: false,
      render: (value, row) => {
        const pointsAwarded = row?.loyaltyPointsAwarded || 0;
        const pointsRequired = row?.loyaltyPointsRequired || 0;
        
        if (pointsAwarded === 0 && pointsRequired === 0) {
          return <span className="text-gray-500">No rewards</span>;
        }
        
        return (
          <div className="text-sm">
            {pointsAwarded > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-green-600 font-medium">+{pointsAwarded}</span>
                <span className="text-xs text-gray-500">awarded</span>
              </div>
            )}
            {pointsRequired > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-blue-600 font-medium">{pointsRequired}</span>
                <span className="text-xs text-gray-500">required</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'purchases',
      label: 'Purchases',
      sortable: false,
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium text-blue-600">{row?._count?.purchases || 0}</div>
          <div className="text-xs text-gray-500">Total purchases</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: false,
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
      key: 'isActive',
      label: 'Status',
      sortable: false,
      render: (value, row) => (
        <ToggleSwitch
          checked={value}
          onChange={() => handleToggleProgrammeStatus(row.id, value)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditProgramme(row)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit programme"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProgramme(row.id)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete programme"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // REORDERED COLUMNS: Price, Discount, Coupon, Status, Method, Purchases, Actions
  const purchaseColumns = [
    {
      key: 'purchaseNumber',
      label: 'Purchase Number',
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
        </div>
      ),
    },
    {
      key: 'programmeName',
      label: 'Programme',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        // Use the actual stored price from the purchase (which includes all discounts)
        const finalPrice = row.price;
        const programmeDiscount = row.discountPercentage || 0;
        const couponDiscount = row.couponDiscount || 0;
        
        // Calculate original price from metadata if available, otherwise estimate
        const originalPrice = row.payment?.metadata?.originalPrice || 
                             (finalPrice && programmeDiscount > 0 ? finalPrice / (1 - programmeDiscount / 100) : finalPrice);
        
        return (
          <div className="text-sm">
            {programmeDiscount > 0 || couponDiscount > 0 ? (
              <div>
                <div className="font-medium text-green-600">
                  {Number(finalPrice).toFixed(2)} {row.currency || 'EGP'}
                </div>
                <div className="text-xs text-gray-500 line-through">
                  {originalPrice ? `${originalPrice} ${row.currency || 'EGP'}` : ''}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  {programmeDiscount > 0 && couponDiscount > 0 ? 
                    `-${programmeDiscount}% plan, -${Number(couponDiscount / originalPrice * 100).toFixed(1)}% coupon` :
                    programmeDiscount > 0 ? `-${programmeDiscount}% off` :
                    couponDiscount > 0 ? `-${Number(couponDiscount / originalPrice * 100).toFixed(1)}% coupon` : ''
                  }
                </div>
              </div>
            ) : (
              <div className="font-medium text-green-600">
                {Number(finalPrice).toFixed(2)} {row.currency || 'EGP'}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'discount',
      label: 'Programme Discount',
      sortable: true,
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
      key: 'couponDiscount',
      label: 'Coupon Discount',
      sortable: true,
        render: (value, row) => {
          if (!row.coupon?.code) {
            return <span className="text-gray-500 text-sm">-</span>;
          }
          
          return (
            <div className="text-sm text-center">
              {/* Coupon code as purple badge */}
              <div className="mb-1">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  {row.coupon.code}
                </span>
              </div>
              {/* Centered percentage */}
              <div className="text-xs text-gray-500">
                {row.coupon?.discountPercentage || 0}% off
              </div>
            </div>
          );
        },
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
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => {
        const statusColors = {
          'PENDING': 'bg-yellow-100 text-yellow-800',
          'COMPLETE': 'bg-green-100 text-green-800',
          'CANCELLED': 'bg-red-100 text-red-800',
        };
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      render: (value, row) => {
        // Get the latest payment for this purchase
        const payment = row.payments && row.payments.length > 0 ? row.payments[0] : null;
        
        if (!payment) {
          return <span className="text-gray-500">N/A</span>;
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            payment.method === 'VODAFONE_CASH' ? 'bg-green-100 text-green-800' :
            payment.method === 'INSTA_PAY' ? 'bg-blue-100 text-blue-800' :
            payment.method === 'CARD' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {payment.method || 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'purchasedAt',
      label: 'Purchased',
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
            <option value="COMPLETE">Complete</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {(row.payment?.proofFile || row.payment?.paymentProofUrl) && (
            <PaymentProofButton payment={row.payment} purchase={row} />
          )}
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
          <p className="text-red-600 mb-4">Please log in to view programmes</p>
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
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={activeTab === 'programmes' ? fetchProgrammes : fetchPurchases}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programmes Management</h1>
          <p className="text-gray-600 mt-1">Manage programmes and customer purchases</p>
        </div>
        {activeTab === 'programmes' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Programme
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {programmeStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{programmeStats.totalPurchases}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{programmeStats.monthlyPurchases}</p>
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
                <p className="text-2xl font-bold text-gray-900">{programmeStats.pendingPurchases || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Cards Row */}
      {programmeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currency} {Number(programmeStats?.monthlyRevenue?.[currency] || 0).toFixed(2)}
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
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('programmes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'programmes'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Programmes
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'purchases'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Programme Purchases
          </button>
        </nav>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {activeTab === 'programmes' ? (
              <>Showing <span className="font-medium text-gray-900">{filteredProgrammes.length}</span> of <span className="font-medium text-gray-900">{programmes.length}</span> programmes</>
            ) : (
              <>Showing <span className="font-medium text-gray-900">{filteredPurchases.length}</span> of <span className="font-medium text-gray-900">{purchases.length}</span> purchases</>
            )}
          </div>
          {(searchTerm || filterProgramme !== 'all' || (activeTab === 'purchases' && filterStatus !== 'all')) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProgramme('all');
                if (activeTab === 'purchases') {
                  setFilterStatus('all');
                }
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {activeTab === 'programmes' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search programmes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-gymmawy-primary focus:border-gymmawy-primary"
                    />
                  </div>
                  <select
                    value={filterProgramme}
                    onChange={(e) => setFilterProgramme(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gymmawy-primary focus:border-gymmawy-primary"
                  >
                    <option value="all">All Programmes</option>
                    {programmes.map(programme => (
                      <option key={programme.id} value={programme.id}>
                        {programme.name?.en || programme.name || 'Unnamed Programme'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gymmawy-primary hover:bg-gymmawy-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gymmawy-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Drag
                      </th>
                      {programmeColumns.map((column) => (
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
                    items={filteredProgrammes.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProgrammes.map((programme) => (
                        <SortableProgrammeRow key={programme.id} programme={programme}>
                          {programmeColumns.map((column) => (
                            <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {column.render
                                ? column.render(programme[column.key], programme)
                                : programme[column.key]
                              }
                            </td>
                          ))}
                        </SortableProgrammeRow>
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </div>
          </div>
        </DndContext>
      ) : (
        <TableWithFilters
          data={filteredPurchases}
          columns={purchaseColumns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              key: 'programme',
              label: 'Programme',
              type: 'select',
              value: filterProgramme,
              onChange: setFilterProgramme,
              options: [
                { value: 'all', label: 'All Programmes' },
                ...(programmes.length > 0 ? programmes.map(programme => ({
                  value: programme.id,
                  label: programme.name?.en || programme.name || 'Unnamed Programme',
                })) : []),
              ],
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              value: filterStatus,
              onChange: setFilterStatus,
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'COMPLETE', label: 'Complete' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ],
            },
          ]}
          onApplyFilters={fetchPurchases}
          onExport={handleExport}
          showApplyButton={false}
          showExportButton={true}
          applyButtonText="Apply Filters"
          exportButtonText="Export"
        />
      )}

      {/* Add Programme Modal */}
      <AddProgrammeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Programme Modal */}
      <AddProgrammeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        editData={selectedProgramme}
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

export default AdminProgrammes;