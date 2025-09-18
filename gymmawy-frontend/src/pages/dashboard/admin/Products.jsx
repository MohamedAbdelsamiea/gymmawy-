import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Package, Tag, Search, Filter, Download, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, filterCategory, filterStatus]);

  const fetchProducts = async() => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (searchTerm) {
params.search = searchTerm;
}
      if (filterCategory !== 'all') {
params.category = filterCategory;
}
      if (filterStatus !== 'all') {
params.status = filterStatus;
}
      
      const response = await adminApiService.getProducts(params);
      setProducts(Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async() => {
    try {
      const response = await adminApiService.getCategories();
      setCategories(Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleDeleteProduct = async(productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApiService.deleteProduct(productId);
        fetchProducts(); // Refresh the list
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  const handleExport = async() => {
    try {
      const response = await adminApiService.getProducts({ export: true });
      console.log('Export data:', response);
    } catch (err) {
      console.error('Error exporting products:', err);
    }
  };

  const columns = [
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
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">SKU: {row.sku || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Tag className="h-3 w-3 mr-1" />
          {value?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">${value || '0.00'}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value === 0 ? 'text-red-600' : 
          value < 10 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {value || 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value || 'active'} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600" 
            title="View Details"
            onClick={() => {/* Handle view */}}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Edit Product"
            onClick={() => {/* Handle edit */}}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-purple-600" 
            title="Manage Variants"
            onClick={() => {/* Handle variants */}}
          >
            <Package className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Product"
            onClick={() => handleDeleteProduct(row.id)}
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
          onClick={fetchProducts}
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
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage all products, variants, and inventory</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(products) ? products.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(products) ? products.filter(p => p.status === 'active').length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(products) ? products.filter(p => p.stock === 0).length : 0}
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
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Array.isArray(products) ? products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(products) ? products : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products..."
        filters={[
          {
            label: "Category",
            value: filterCategory,
            onChange: setFilterCategory,
            options: [
              { value: "all", label: "All Categories" },
              ...(Array.isArray(categories) ? categories.map(category => ({
                value: category.id,
                label: category.name,
              })) : []),
            ],
          },
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "out_of_stock", label: "Out of Stock" },
            ],
          },
        ]}
        onApplyFilters={fetchProducts}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        exportButtonText="Export"
      />
    </div>
  );
};

export default AdminProducts;
