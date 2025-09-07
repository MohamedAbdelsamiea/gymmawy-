import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, Package, CreditCard, Play } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../components/dashboard';
import programmeService from '../../../services/programmeService';
import subscriptionService from '../../../services/subscriptionService';

const PurchaseHistory = () => {
  const { t } = useTranslation("dashboard");
  const [activeTab, setActiveTab] = useState('programmes');
  const [programmes, setProgrammes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's programmes
      const programmesData = await programmeService.getUserProgrammes();
      setProgrammes(programmesData.items || []);
      
      // Fetch user's subscriptions
      const subscriptionsData = await subscriptionService.getUserSubscriptions();
      setSubscriptions(subscriptionsData.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

  const programmeColumns = [
    {
      key: 'purchaseNumber',
      label: 'Purchase Number',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'programme',
      label: 'Programme',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Play className="h-4 w-4 mr-2 text-gymmawy-primary" />
          <span className="font-medium">{value.name}</span>
        </div>
      )
    },
    {
      key: 'purchasedAt',
      label: 'Purchase Date',
      sortable: true,
      render: (value) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">
          {value} EGP
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const subscriptionColumns = [
    {
      key: 'id',
      label: 'Subscription ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'subscriptionPlan',
      label: 'Plan',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-gymmawy-primary" />
          <span className="font-medium">{value.name}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Start Date',
      sortable: true,
      render: (value) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">
          {value} EGP
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'ACTIVE' && (
            <button className="p-1 text-gray-400 hover:text-red-600" title="Cancel Subscription">
              <CreditCard className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const handleExport = (data) => {
    // Exporting purchase history data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading purchase history: {error}</div>
        <button 
          onClick={fetchPurchaseHistory}
          className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
          <p className="text-gray-600 mt-1">View your programmes and subscriptions</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </button>
      </div>

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
            <Play className="h-4 w-4 inline mr-2" />
            Programmes
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Subscriptions
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{programmes.length}</div>
          <div className="text-sm text-gray-600">Total Programmes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {programmes.reduce((sum, p) => sum + parseFloat(p.price), 0).toFixed(2)} EGP
          </div>
          <div className="text-sm text-gray-600">Total Spent on Programmes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{subscriptions.length}</div>
          <div className="text-sm text-gray-600">Total Subscriptions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {subscriptions.filter(s => s.status === 'ACTIVE').length}
          </div>
          <div className="text-sm text-gray-600">Active Subscriptions</div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'programmes' ? (
        <DataTable
          data={programmes}
          columns={programmeColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      ) : (
        <DataTable
          data={subscriptions}
          columns={subscriptionColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default PurchaseHistory;
