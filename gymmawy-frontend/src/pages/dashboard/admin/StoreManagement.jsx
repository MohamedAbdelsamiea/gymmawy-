import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Package, ShoppingCart } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../components/dashboard';

const StoreManagement = () => {
  const [activeTab, setActiveTab] = useState('products');

  const [products] = useState([
    {
      id: 'PROD001',
      name: 'Premium Protein Powder',
      category: 'Supplements',
      price: '$49.99',
      stock: 45,
      status: 'Active',
      createdAt: '2024-01-15',
      sales: 156,
    },
    {
      id: 'PROD002',
      name: 'Resistance Bands Set',
      category: 'Equipment',
      price: '$29.99',
      stock: 23,
      status: 'Active',
      createdAt: '2024-01-10',
      sales: 89,
    },
    {
      id: 'PROD003',
      name: 'Yoga Mat Premium',
      category: 'Equipment',
      price: '$39.99',
      stock: 0,
      status: 'Out of Stock',
      createdAt: '2024-01-05',
      sales: 234,
    },
  ]);

  const [orders] = useState([
    {
      id: 'ORD001',
      customer: 'Ahmed Mohamed',
      email: 'ahmed@example.com',
      items: 3,
      total: '$119.97',
      status: 'Processing',
      orderDate: '2024-01-20',
      shippingAddress: 'Cairo, Egypt',
    },
    {
      id: 'ORD002',
      customer: 'Sarah Ali',
      email: 'sarah@example.com',
      items: 1,
      total: '$49.99',
      status: 'Shipped',
      orderDate: '2024-01-19',
      shippingAddress: 'Alexandria, Egypt',
    },
    {
      id: 'ORD003',
      customer: 'Omar Hassan',
      email: 'omar@example.com',
      items: 2,
      total: '$69.98',
      status: 'Delivered',
      orderDate: '2024-01-18',
      shippingAddress: 'Giza, Egypt',
    },
  ]);

  const productColumns = [
    {
      key: 'id',
      label: 'Product ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value) => {
        if (typeof value === 'object' && value !== null) {
          return value.en || value.ar || 'Unnamed';
        }
        return value || 'Unnamed';
      },
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => {
        if (typeof value === 'object' && value !== null) {
          return value.name || value.en || value.ar || 'Uncategorized';
        }
        return value || 'Uncategorized';
      },
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">{value}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${value === 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'sales',
      label: 'Sales',
      sortable: true,
      render: (value) => value || 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-green-600">
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const orderColumns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || 'N/A',
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      render: (value) => value || 0,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-green-600">
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleExport = (data) => {
    // Exporting store data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">Manage products and orders</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            Orders
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">89</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">2,156</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">$45,230</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">12</div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'products' ? (
        <DataTable
          data={products}
          columns={productColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      ) : (
        <DataTable
          data={orders}
          columns={orderColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default StoreManagement;
