import React, { useState } from 'react';
import { Package, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/dashboard';

const OrderTracking = () => {
  const [activeOrder, setActiveOrder] = useState('ORD001');

  const [orders] = useState([
    {
      id: 'ORD001',
      status: 'Shipped',
      items: ['Premium Protein Powder', 'Shaker Bottle'],
      total: '$89.99',
      orderDate: '2024-01-20',
      estimatedDelivery: '2024-01-25',
      trackingNumber: 'TRK123456789',
      carrier: 'DHL Express',
      currentLocation: 'Cairo Distribution Center',
      trackingHistory: [
        {
          status: 'Order Placed',
          date: '2024-01-20',
          time: '10:30 AM',
          location: 'Online Store',
          completed: true,
        },
        {
          status: 'Processing',
          date: '2024-01-20',
          time: '2:15 PM',
          location: 'Warehouse',
          completed: true,
        },
        {
          status: 'Shipped',
          date: '2024-01-21',
          time: '9:45 AM',
          location: 'Cairo Distribution Center',
          completed: true,
        },
        {
          status: 'In Transit',
          date: '2024-01-22',
          time: '11:20 AM',
          location: 'Alexandria Hub',
          completed: false,
        },
        {
          status: 'Out for Delivery',
          date: '2024-01-25',
          time: '8:00 AM',
          location: 'Local Delivery',
          completed: false,
        },
        {
          status: 'Delivered',
          date: '2024-01-25',
          time: '2:30 PM',
          location: 'Your Address',
          completed: false,
        },
      ],
    },
    {
      id: 'ORD002',
      status: 'Delivered',
      items: ['Resistance Bands Set'],
      total: '$45.50',
      orderDate: '2024-01-15',
      estimatedDelivery: '2024-01-20',
      trackingNumber: 'TRK987654321',
      carrier: 'Aramex',
      currentLocation: 'Delivered',
      trackingHistory: [
        {
          status: 'Order Placed',
          date: '2024-01-15',
          time: '3:20 PM',
          location: 'Online Store',
          completed: true,
        },
        {
          status: 'Processing',
          date: '2024-01-15',
          time: '5:45 PM',
          location: 'Warehouse',
          completed: true,
        },
        {
          status: 'Shipped',
          date: '2024-01-16',
          time: '10:30 AM',
          location: 'Cairo Distribution Center',
          completed: true,
        },
        {
          status: 'In Transit',
          date: '2024-01-17',
          time: '2:15 PM',
          location: 'Alexandria Hub',
          completed: true,
        },
        {
          status: 'Out for Delivery',
          date: '2024-01-20',
          time: '9:00 AM',
          location: 'Local Delivery',
          completed: true,
        },
        {
          status: 'Delivered',
          date: '2024-01-20',
          time: '1:45 PM',
          location: 'Your Address',
          completed: true,
        },
      ],
    },
  ]);

  const selectedOrder = orders.find(order => order.id === activeOrder);

  const getStatusIcon = (status, completed) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    switch (status) {
      case 'Order Placed':
      case 'Processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'Shipped':
      case 'In Transit':
        return <Truck className="h-5 w-5 text-orange-500" />;
      case 'Out for Delivery':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'Delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-1">Track your orders and delivery status</p>
        </div>
      </div>

      {/* Order Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Order to Track</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setActiveOrder(order.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                activeOrder === order.id
                  ? 'border-gymmawy-primary bg-gymmawy-primary bg-opacity-5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gymmawy-primary">{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {order.items.join(', ')}
              </p>
              <p className="text-sm font-medium text-gray-900">
                Total: {order.total}
              </p>
            </button>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <>
          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-600">Order #{selectedOrder.id}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Order Date</h4>
                <p className="text-sm text-gray-900">{selectedOrder.orderDate}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h4>
                <p className="text-sm text-gray-900">{selectedOrder.estimatedDelivery}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h4>
                <p className="text-sm text-gray-900 font-mono">{selectedOrder.trackingNumber}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Carrier</h4>
                <p className="text-sm text-gray-900">{selectedOrder.carrier}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-900">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking Timeline</h3>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {selectedOrder.trackingHistory.map((step, index) => (
                  <div key={index} className="relative flex items-start">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {getStatusIcon(step.status, step.completed)}
                    </div>
                    
                    {/* Content */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.status}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.date} at {step.time}
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${
                        step.completed ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedOrder.status}</h4>
                <p className="text-sm text-gray-600">{selectedOrder.currentLocation}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderTracking;
