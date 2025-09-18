import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import DataTable from '../../components/common/DataTable';
import { useAuth } from '../../contexts/AuthContext';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns = [
    {
      key: 'id',
      label: 'Payment ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-gray-600">#{value.slice(0, 8)}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => (
        <span className="font-semibold">
          {value} {row.currency}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          PENDING: 'bg-yellow-100 text-yellow-800',
          SUCCESS: 'bg-green-100 text-green-800',
          COMPLETED: 'bg-green-100 text-green-800',
          FAILED: 'bg-red-100 text-red-800',
          CANCELLED: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row.id)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="View details"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchPayments = async() => {
    try {
      setLoading(true);
      console.log('User role:', user?.role);
      console.log('User:', user);
      console.log('Token:', localStorage.getItem('accessToken'));
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        q: searchTerm || undefined,
        status: statusFilter || undefined,
      };

      console.log('Fetching payments with params:', params);
      const response = await adminApiService.getPayments(params);
      console.log('Payments response:', response);
      console.log('Response items:', response.items);
      console.log('Response total:', response.total);
      
      setPayments(response.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
      
      console.log('Payments state set to:', response.items || []);
      console.log('Pagination total set to:', response.total || 0);
    } catch (err) {
      setError('Failed to fetch payments');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleView = (id) => {
    // Implement view payment details
    console.log('View payment:', id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage payment transactions and payment methods</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>User Role: {user?.role || 'Not logged in'}</p>
        <p>User ID: {user?.id || 'N/A'}</p>
        <p>Token Present: {localStorage.getItem('accessToken') ? 'Yes' : 'No'}</p>
        <p>Payments Count: {payments.length}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700">
          <h3 className="font-semibold">DataTable Debug:</h3>
          <p>Data length: {payments.length}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Pagination: {JSON.stringify(pagination)}</p>
          <p>First payment: {payments.length > 0 ? JSON.stringify(payments[0]) : 'No payments'}</p>
        </div>
        <DataTable
          data={payments}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      </div>
    </div>
  );
};

export default Payments;
