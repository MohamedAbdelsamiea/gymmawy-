import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Search, Filter, Download, CreditCard, Users, MoreVertical, X, Play, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import AddProgrammeModal from '../../../components/modals/AddProgrammeModal';
import adminApiService from '../../../services/adminApiService';
import { useAuth } from '../../../contexts/AuthContext';

const AdminProgrammes = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('programmes');
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
      } else if (activeTab === 'purchases') {
        fetchPurchases();
        fetchProgrammeStats();
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
          programme.description?.ar?.toLowerCase().includes(searchLower)
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
          purchase.programmeName?.toLowerCase().includes(searchLower)
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

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getProgrammes();
      const programmesData = response.items || response.data || response || [];
      
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
    } catch (err) {
      console.error('Error fetching programmes:', err);
      setError('Failed to fetch programmes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getProgrammePurchases();
      const purchasesData = response.items || response.data || response || [];
      
      // Map the data to include user and programme information for easier access
      const mappedData = purchasesData.map(purchase => ({
        ...purchase,
        userName: purchase.user?.firstName && purchase.user?.lastName 
          ? `${purchase.user.firstName} ${purchase.user.lastName}` 
          : purchase.user?.email || 'N/A',
        userEmail: purchase.user?.email || 'N/A',
        programmeName: purchase.programme?.name?.en || purchase.programme?.name || 'N/A',
        programmeId: purchase.programme?.id || 'N/A'
      }));
      
      setPurchases(Array.isArray(mappedData) ? mappedData : []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammeStats = async () => {
    try {
      const response = await adminApiService.getProgrammeStats();
      setProgrammeStats(response.stats);
    } catch (err) {
      console.error('Error fetching programme stats:', err);
    }
  };

  const handleDeleteProgramme = async (programmeId) => {
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

  const handleUpdatePurchaseStatus = async (purchaseId, newStatus) => {
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
          'Created At': programme.createdAt ? new Date(programme.createdAt).toLocaleDateString() : ''
        }));

        exportToCSV(dataToExport, 'programmes');
      } else {
        // Export purchases data
        const dataToExport = filteredPurchases.map(purchase => ({
          'Customer Email': purchase.userEmail || '',
          'Programme Name': purchase.programmeName || '',
          'Price': purchase.price ? `${purchase.price} ${purchase.currency || 'EGP'}` : 'N/A',
          'Discount': purchase.discount || 0,
          'Purchased At': purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : ''
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
        }).join(',')
      )
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
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value?.en || 'N/A'}</div>
          <div className="text-sm text-gray-500" dir="rtl">{value?.ar || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        const discount = row.discount || 0;
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
      key: 'discount',
      label: 'Discount',
      sortable: true,
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row?.discount > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {row?.discount || 0}%
        </span>
      )
    },
    {
      key: 'loyaltyReward',
      label: 'Loyalty Reward',
      sortable: true,
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
      }
    },
    {
      key: 'purchases',
      label: 'Purchases',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium text-blue-600">{row?._count?.purchases || 0}</div>
          <div className="text-xs text-gray-500">Total purchases</div>
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
      )
    }
  ];

  // REORDERED COLUMNS: Price, Discount, Status, Method, Purchases, Actions
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
      key: 'programmeName',
      label: 'Programme',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        const originalPrice = row.programme?.priceEGP || row.programme?.priceSAR || row.price;
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
      render: (value, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row?.discount > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {row?.discount || 0}%
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => {
        const statusColors = {
          'PENDING': 'bg-yellow-100 text-yellow-800',
          'COMPLETE': 'bg-green-100 text-green-800'
        };
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      render: (value, row) => {
        const payment = row.payment;
        if (!payment) return <span className="text-gray-500">N/A</span>;
        
        return (
          <div>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {payment.method || 'N/A'}
            </span>
            {payment.proofFile && (
              <div className="mt-1 flex justify-center">
                <button
                  onClick={() => window.open(payment.proofFile, '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                  title="Click to view payment proof in new tab"
                >
                  View Proof
                </button>
              </div>
            )}
          </div>
        );
      }
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
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          {row.status === 'PENDING' && (
            <button
              onClick={() => handleUpdatePurchaseStatus(row.id, 'COMPLETE')}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              title="Mark as Complete"
            >
              Approve
            </button>
          )}
          {row.status === 'COMPLETE' && (
            <button
              onClick={() => handleUpdatePurchaseStatus(row.id, 'PENDING')}
              className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              title="Mark as Pending"
            >
              Revert
            </button>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currency === 'EGP' ? 'EGP' : 'SAR'} {programmeStats.monthlyRevenue?.[currency]?.toFixed(2) || '0.00'}
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
      <TableWithFilters
        data={activeTab === 'programmes' ? filteredProgrammes : filteredPurchases}
        columns={activeTab === 'programmes' ? programmeColumns : purchaseColumns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={activeTab === 'programmes' ? [
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
                label: programme.name?.en || programme.name || 'Unnamed Programme'
              })) : [])
            ]
          }
        ] : [
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
                label: programme.name?.en || programme.name || 'Unnamed Programme'
              })) : [])
            ]
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
              { value: 'COMPLETE', label: 'Complete' }
            ]
          }
        ]}
        onApplyFilters={activeTab === 'programmes' ? fetchProgrammes : fetchPurchases}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        applyButtonText="Apply Filters"
        exportButtonText="Export"
      />

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
    </div>
  );
};

export default AdminProgrammes;