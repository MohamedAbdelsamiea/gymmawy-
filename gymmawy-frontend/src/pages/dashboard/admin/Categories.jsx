import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Tag, Package, Search } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApiService.getCategories();
      let categoriesData = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      
      // Filter by search term if provided
      if (searchTerm && Array.isArray(categoriesData)) {
        categoriesData = categoriesData.filter(category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await adminApiService.deleteCategory(categoryId);
        fetchCategories(); // Refresh the list
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Category ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center">
            <Tag className="h-4 w-4 mr-2 text-gray-400" />
            {value}
          </div>
          <div className="text-sm text-gray-500">/{row.slug || value.toLowerCase().replace(/\s+/g, '-')}</div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {value || 'No description'}
        </div>
      )
    },
    {
      key: 'parentCategory',
      label: 'Parent Category',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Root Category'}
        </span>
      )
    },
    {
      key: 'productCount',
      label: 'Products',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Package className="h-3 w-3 mr-1" />
          {value || 0}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value || 'active'} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
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
            title="Edit Category"
            onClick={() => {/* Handle edit */}}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Category"
            onClick={() => handleDeleteCategory(row.id)}
          >
            <Trash2 className="h-4 w-4" />
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
          onClick={fetchCategories}
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
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600 mt-1">Organize products with categories and subcategories</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{Array.isArray(categories) ? categories.length : 0}</div>
          <div className="text-sm text-gray-600">Total Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {Array.isArray(categories) ? categories.filter(c => c.status === 'active').length : 0}
          </div>
          <div className="text-sm text-gray-600">Active Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {Array.isArray(categories) ? categories.filter(c => c.parentCategory).length : 0}
          </div>
          <div className="text-sm text-gray-600">Subcategories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {Array.isArray(categories) ? categories.reduce((sum, c) => sum + (c.productCount || 0), 0) : 0}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
      </div>

      {/* Categories Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(categories) ? categories : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        filters={[]}
        onApplyFilters={fetchCategories}
        onExport={() => {}}
        showApplyButton={false}
        showExportButton={false}
      />
    </div>
  );
};

export default AdminCategories;
