import React, { useState, useEffect } from 'react';
import { Eye, Edit, Download, Truck, Package, Search, Filter, Plus, ShoppingBag, Clock, CheckCircle, DollarSign, X } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import PaymentProofModal from '../../../components/modals/PaymentProofModal';
import adminApiService from '../../../services/adminApiService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filterStatus, filterDate]);

  const fetchOrders = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchTerm) {
params.search = searchTerm;
}
      if (filterStatus !== 'all') {
params.status = filterStatus;
}
      if (filterDate !== 'all') {
params.date = filterDate;
}
      
      const response = await adminApiService.getOrders(params);
      // Handle the response format: { orders: { items: [...] } }
      const ordersData = response?.orders?.items || response?.data?.orders?.items || response?.data || response || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async(orderId, newStatus) => {
    try {
      await adminApiService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleViewPaymentProof = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      await adminApiService.approvePayment(paymentId);
      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchOrders(); // Refresh the list
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
      fetchOrders(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to activate this order? This will set the subscription start and end dates.')) {
      try {
        setIsProcessing(true);
        await adminApiService.activateOrder(orderId);
        fetchOrders(); // Refresh the list
        alert('Order activated successfully!');
      } catch (err) {
        console.error('Error activating order:', err);
        alert('Failed to activate order. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to reject this order?')) {
      try {
        setIsProcessing(true);
        await adminApiService.rejectOrder(orderId);
        fetchOrders(); // Refresh the list
        alert('Order rejected successfully!');
      } catch (err) {
        console.error('Error rejecting order:', err);
        alert('Failed to reject order. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleExport = async() => {
    try {
      const response = await adminApiService.exportOrders({
        search: searchTerm,
        status: filterStatus,
        date: filterDate,
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
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.user?.firstName && row.user?.lastName 
              ? `${row.user.firstName} ${row.user.lastName}` 
              : row.user?.email || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{row.user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'orderItems',
      label: 'Order Items',
      sortable: false,
      render: (value, row) => {
        const items = row.items || [];
        if (items.length === 0) {
          return <span className="text-gray-500">No items</span>;
        }
        
        return (
          <div className="space-y-1">
            {items.slice(0, 2).map((item, index) => (
              <div key={index} className="text-xs">
                <div className="font-medium text-gray-900">
                  {item.product?.name?.en || item.product?.name || 'Unknown Product'}
                </div>
                <div className="text-gray-500">Qty: {item.quantity}</div>
              </div>
            ))}
            {items.length > 2 && (
              <div className="text-xs text-blue-600 font-medium">
                +{items.length - 2} more items
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        // Use the actual stored price from the order (which includes all discounts)
        const finalPrice = row.price;
        const orderDiscount = row.discountPercentage || 0;
        const couponDiscount = row.couponDiscount || 0;
        
        // Calculate original price from metadata if available, otherwise estimate
        const originalPrice = row.metadata?.originalPrice || 
                             (finalPrice && orderDiscount > 0 ? finalPrice / (1 - orderDiscount / 100) : finalPrice);
        
        return (
          <div className="text-sm">
            {orderDiscount > 0 || couponDiscount > 0 ? (
              <div>
                <div className="font-medium text-green-600">
                  {Number(finalPrice).toFixed(2)} {row.currency || 'EGP'}
                </div>
                <div className="text-xs text-gray-500 line-through">
                  {originalPrice ? `${Number(originalPrice).toFixed(2)} ${row.currency || 'EGP'}` : ''}
                </div>
                <div className="text-xs text-red-600 font-medium">
                  {orderDiscount > 0 && couponDiscount > 0 ? 
                    `-${orderDiscount}% order, -${Number(couponDiscount / originalPrice * 100).toFixed(1)}% coupon` :
                    orderDiscount > 0 ? `-${orderDiscount}% off` :
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
      label: 'Order Discount',
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
            <div className="mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                {row.coupon.code}
              </span>
            </div>
            {/* Centered percentage with more spacing */}
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
        const paymentRef = row.orderNumber || 'N/A';
        
        return (
          <div className="text-sm">
            <div className="font-medium text-green-600">
              {paymentRef}
            </div>
            <div className="text-xs text-gray-400">
              ORDER: {row.id.substring(0, 8)}...
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          'PENDING': 'bg-yellow-100 text-yellow-800',
          'PAID': 'bg-green-100 text-green-800',
          'SHIPPED': 'bg-blue-100 text-blue-800',
          'DELIVERED': 'bg-emerald-100 text-emerald-800',
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
        const paymentMethod = row.paymentMethod;
        
        if (!paymentMethod) {
          return <span className="text-gray-500">N/A</span>;
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            paymentMethod === 'VODAFONE_CASH' ? 'bg-green-100 text-green-800' :
            paymentMethod === 'INSTA_PAY' ? 'bg-blue-100 text-blue-800' :
            paymentMethod === 'CASH_ON_DELIVERY' ? 'bg-orange-100 text-orange-800' :
            paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {paymentMethod || 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Ordered',
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
          <button
            onClick={() => handleViewOrderDetails(row)}
            className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50 transition-colors flex items-center gap-1"
            title="View order details"
          >
            <Eye className="w-3 h-3" />
            Details
          </button>
          <select
            value={row.status}
            onChange={(e) => handleUpdateOrderStatus(row.id, e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {row.paymentProof && (
            <button
              onClick={() => handleViewPaymentProof({ 
                id: row.id, 
                paymentProofUrl: row.paymentProof,
                paymentReference: row.orderNumber,
                amount: row.price,
                currency: row.currency,
                method: row.paymentMethod,
                user: row.user
              })}
              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
              title="Click to view payment proof"
            >
              <Eye className="w-3 h-3" />
              Proof
            </button>
          )}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track and manage all customer orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(orders) ? orders.filter(o => o.status === 'DELIVERED' || o.status === 'PAID').length : 0}
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
                {Array.isArray(orders) ? orders.filter(o => o.status === 'PENDING').length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(orders) ? orders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0).toFixed(2) : '0.00'} EGP
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(orders) ? orders.reduce((sum, o) => sum + (o.items?.length || 0), 0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{Array.isArray(orders) ? orders.length : 0}</span> orders
          </div>
          {(searchTerm || filterStatus !== 'all' || filterDate !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterDate('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear filters
            </button>
          )}
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
              { value: "CANCELLED", label: "Cancelled" },
            ],
          },
          {
            label: "Date Range",
            value: filterDate,
            onChange: setFilterDate,
            options: [
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ],
          },
        ]}
        onApplyFilters={fetchOrders}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        applyButtonText="Apply Filters"
        exportButtonText="Export"
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

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-gray-600">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedOrder.user?.firstName && selectedOrder.user?.lastName 
                          ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` 
                          : selectedOrder.user?.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.user?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.user?.mobileNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedOrder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        selectedOrder.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                      <span className="ml-2 text-gray-900">{selectedOrder.paymentMethod || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {Number(selectedOrder.price).toFixed(2)} {selectedOrder.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Order Date:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {(selectedOrder.shippingBuilding || selectedOrder.shippingStreet || selectedOrder.shippingCity) && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="text-gray-900">
                    {selectedOrder.shippingBuilding && selectedOrder.shippingStreet && (
                      <div>{selectedOrder.shippingBuilding}, {selectedOrder.shippingStreet}</div>
                    )}
                    {selectedOrder.shippingCity && selectedOrder.shippingCountry && (
                      <div>{selectedOrder.shippingCity}, {selectedOrder.shippingCountry}</div>
                    )}
                    {selectedOrder.shippingPostcode && (
                      <div>Postal Code: {selectedOrder.shippingPostcode}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.product?.name?.en || item.product?.name || 'Unknown Product'}
                          </h4>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <span className="ml-2 font-medium">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="ml-2 font-medium">
                                {(Number(item.totalPrice) / item.quantity).toFixed(2)} {selectedOrder.currency}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Price:</span>
                              <span className="ml-2 font-medium">
                                {Number(item.totalPrice).toFixed(2)} {selectedOrder.currency}
                              </span>
                            </div>
                            {item.discountPercentage > 0 && (
                              <div>
                                <span className="text-gray-600">Discount:</span>
                                <span className="ml-2 font-medium text-red-600">
                                  {item.discountPercentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Information */}
              {selectedOrder.coupon && (
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Coupon Applied</h3>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {selectedOrder.coupon.code}
                    </span>
                    <span className="text-sm text-gray-600">
                      {selectedOrder.coupon.discountPercentage}% discount
                    </span>
                    {selectedOrder.couponDiscount && (
                      <span className="text-sm font-medium text-green-600">
                        Saved: {Number(selectedOrder.couponDiscount).toFixed(2)} {selectedOrder.currency}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
