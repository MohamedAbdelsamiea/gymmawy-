import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Users, Search } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import adminApiService from '../../../services/adminApiService';
import AddCouponModal from '../../../components/modals/AddCouponModal';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Client-side filtering effect
  useEffect(() => {
    let filtered = [...coupons];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchLower),
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(coupon => 
        filterStatus === 'active' ? coupon.isActive : !coupon.isActive,
      );
    }

    setFilteredCoupons(filtered);
  }, [searchTerm, filterStatus, coupons]);

  const fetchCoupons = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getCoupons();
      setCoupons(Array.isArray(response.items) ? response.items : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteCoupon = async(couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await adminApiService.deleteCoupon(couponId);
        fetchCoupons();
      } catch (err) {
        console.error('Error deleting coupon:', err);
      }
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowCreateModal(true);
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingCoupon(null);
  };

  const handleModalSuccess = () => {
    fetchCoupons();
    handleModalClose();
  };

  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update the local state first for immediate UI feedback
      setCoupons(prevCoupons => 
        prevCoupons.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, isActive: newStatus }
            : coupon
        )
      );
      
      // Update the filtered coupons as well
      setFilteredCoupons(prevFiltered => 
        prevFiltered.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, isActive: newStatus }
            : coupon
        )
      );
      
      // Then make the API call
      await adminApiService.updateCoupon(couponId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      setError('Failed to update coupon status');
      
      // Revert the optimistic update on error
      setCoupons(prevCoupons => 
        prevCoupons.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, isActive: currentStatus }
            : coupon
        )
      );
      
      setFilteredCoupons(prevFiltered => 
        prevFiltered.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, isActive: currentStatus }
            : coupon
        )
      );
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Coupon Code',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: 'discountValue',
      label: 'Discount',
      sortable: true,
      render: (value, row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {value}%
        </span>
      ),
    },
    {
      key: 'maxRedemptionsPerUser',
      label: 'Max Per User',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {value === 0 ? 'UNLIMITED' : value}
        </span>
      ),
    },
    {
      key: 'maxRedemptions',
      label: 'Max Total',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {value === 0 || value === null ? 'UNLIMITED' : value}
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-gray-400" />
          <span className="text-sm">
            {row.totalRedemptions || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
          <div className="text-sm">
            {new Date(value).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'expirationDate',
      label: 'Expires',
      sortable: true,
      render: (value) => {
        const expirationDate = new Date(value);
        const isExpired = expirationDate < new Date();
        
        return (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            <div className="text-sm">
              {expirationDate.toLocaleDateString()}
              {isExpired && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  EXPIRED
                </span>
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
          onChange={() => handleToggleStatus(row.id, value)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Edit Coupon"
            onClick={() => handleEditCoupon(row)}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Coupon"
            onClick={() => handleDeleteCoupon(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

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
          onClick={fetchCoupons}
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
          <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons and promotional codes</p>
        </div>
        <button 
          onClick={handleCreateCoupon}
          className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </button>
      </div>


      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredCoupons.length}</span> of <span className="font-medium text-gray-900">{coupons.length}</span> coupons
          </div>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Coupons Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(filteredCoupons) ? filteredCoupons : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search coupons..."
        filters={[
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        onApplyFilters={fetchCoupons}
        onExport={() => {}}
        showApplyButton={false}
        showExportButton={false}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <AddCouponModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editData={editingCoupon}
          isEdit={!!editingCoupon}
        />
      )}
    </div>
  );
};

export default AdminCoupons;
