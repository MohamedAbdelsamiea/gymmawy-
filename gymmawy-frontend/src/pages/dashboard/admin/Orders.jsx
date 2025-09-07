import React, { useState, useEffect } from 'react';
import { Eye, Edit, Download, Truck, Package, Search, Filter, Plus, ShoppingBag, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filterStatus, filterDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDate !== 'all') params.date = filterDate;
      
      const response = await adminApiService.getOrders(params);
      setOrders(Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApiService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminApiService.exportOrders({
        search: searchTerm,
        status: filterStatus,
        date: filterDate
      });
      console.log('Export data:', response);
    } catch (err) {
      console.error('Error exporting orders:', err);
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order Number',
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
          <div className="font-medium text-gray-900">{row.customerName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.customerEmail || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Package className="h-3 w-3 mr-1" />
          {value || 0}
        </span>
      )
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">${value || '0.00'}</span>
      )
    },
    {
      key: 'status',
      label: 'Order Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'SUCCESS' ? 'bg-green-100 text-green-800' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          value === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'shippingStatus',
      label: 'Shipping',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'DELIVERED' ? 'bg-green-100 text-green-800' :
          value === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
          value === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value?.replace('_', ' ') || 'Not Shipped'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Order Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'shippingAddress',
      label: 'Shipping Address',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {value || 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600" 
            title="View Order Details"
            onClick={() => {/* Handle view */}}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Update Status"
            onClick={() => {/* Handle status update */}}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-purple-600" 
            title="Track Shipment"
            onClick={() => {/* Handle tracking */}}
          >
            <Truck className="h-4 w-4" />
          </button>
        </div>
      )
    }
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
          onClick={fetchOrders}
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
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all customer orders</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(orders) ? orders.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(orders) ? orders.filter(o => o.status === 'PENDING').length : 0}
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
              <p className="text-sm font-medium text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(orders) ? orders.filter(o => o.status === 'DELIVERED').length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Array.isArray(orders) ? orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(orders) ? orders : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search orders..."
        filters={[
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "PENDING", label: "Pending" },
              { value: "PAID", label: "Paid" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "CANCELLED", label: "Cancelled" }
            ]
          },
          {
            label: "Date Range",
            value: filterDate,
            onChange: setFilterDate,
            options: [
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" }
            ]
          }
        ]}
        onApplyFilters={fetchOrders}
        onExport={handleExport}
        showApplyButton={true}
        showExportButton={true}
        applyButtonText="Apply Filters"
        exportButtonText="Export"
      />
    </div>
  );
};

export default AdminOrders;
