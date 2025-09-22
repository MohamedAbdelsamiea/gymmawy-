import React, { useState, useEffect } from 'react';
import { Package, Eye, X, AlertCircle } from 'lucide-react';
import userService from '../../../services/userService';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getOrders();
      setOrders(response.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'SHIPPED': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">View and track your order history</p>
        </div>
        <div className="text-sm text-gray-500">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">You haven't placed any orders yet. Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Order Summary */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <span className="text-gray-600">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {Number(order.price).toFixed(2)} {order.currency}
                    </span>
                    {order.discountPercentage > 0 && (
                      <span className="text-red-600 font-medium">
                        {order.discountPercentage}% off
                      </span>
                    )}
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index}>
                            {item.product?.name?.en || item.product?.name || `Product ${item.productId}`}
                            <span className="text-gray-500 ml-2">(Qty: {item.quantity})</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-gray-500">+{order.items.length - 2} more items</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Discount and Coupon Info */}
                  {order.coupon && (
                    <div className="mb-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Coupon: {order.coupon.code}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleViewOrderDetails(order)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-gymmawy-primary bg-gymmawy-primary bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Order Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {Number(selectedOrder.price).toFixed(2)} {selectedOrder.currency}
                    </span>
                  </div>
                  {selectedOrder.discountPercentage > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Discount:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {selectedOrder.discountPercentage}% off
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {item.product?.name?.en || item.product?.name || 'Unknown Product'}
                          </h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Quantity: {item.quantity} × {(Number(item.totalPrice) / item.quantity).toFixed(2)} {selectedOrder.currency}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {Number(item.totalPrice).toFixed(2)} {selectedOrder.currency}
                          </div>
                          {item.discountPercentage > 0 && (
                            <div className="text-xs text-red-600">
                              {item.discountPercentage}% off
                            </div>
                          )}
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

export default UserOrders;
