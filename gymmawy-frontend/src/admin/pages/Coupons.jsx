import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import DataTable from '../../components/common/DataTable';
import AddCouponModal from '../../components/modals/AddCouponModal';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      key: 'discountType',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'PERCENTAGE' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'discountValue',
      label: 'Value',
      sortable: true,
      render: (value, row) => (
        <span className="font-semibold">
          {row.discountType === 'PERCENTAGE' ? `${value}%` : `$${value}`}
        </span>
      ),
    },
    {
      key: 'redemptions',
      label: 'Used',
      sortable: true,
      render: (value, row) => (
        <span className="text-gray-600">
          {value} / {row.maxRedemptions === 0 ? '∞' : row.maxRedemptions}
        </span>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Expires',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={`${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit coupon"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Delete coupon"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchCoupons = async() => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        q: searchTerm || undefined,
        isActive: filterActive === '' ? undefined : filterActive === 'true',
      };

      const response = await adminApiService.getCoupons(params);
      setCoupons(response.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch (err) {
      setError('Failed to fetch coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, pagination.limit, searchTerm, filterActive]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (value) => {
    setFilterActive(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setIsAddModalOpen(true);
  };

  const handleDelete = async(id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await adminApiService.deleteCoupon(id);
        fetchCoupons();
      } catch (err) {
        setError('Failed to delete coupon');
        console.error('Error deleting coupon:', err);
      }
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSuccess = () => {
    fetchCoupons();
    handleModalClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-600">Manage discount coupons and promotional codes</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filterActive}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          data={coupons}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <AddCouponModal
          isOpen={isAddModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          editData={editingCoupon}
          isEdit={!!editingCoupon}
        />
      )}
    </div>
  );
};

export default Coupons;
