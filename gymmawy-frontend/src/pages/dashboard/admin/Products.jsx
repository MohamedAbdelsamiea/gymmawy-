import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Package, Tag, Search, Filter, Download, CheckCircle, XCircle, PlusCircle, X, GripVertical } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import AddProductModal from '../../../components/dashboard/AddProductModal';
import EditProductModal from '../../../components/dashboard/EditProductModal';
import adminApiService from '../../../services/adminApiService';
import productService from '../../../services/productService';
import { config } from '../../../config';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component
const SortableRow = ({ product, onEdit, onDelete, onToggleStatus, onAddStock }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-shrink-0">
            {product.images?.[0] ? (
              <img
                src={product.images[0].url.startsWith('http') ? product.images[0].url : `${config.STATIC_BASE_URL}${product.images[0].url}`}
                alt="Product"
                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                <Package className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="font-medium text-gray-900">
            {typeof product.name === 'object' ? (product.name?.en || product.name?.ar || 'Unnamed Product') : product.name || 'Unnamed Product'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="text-sm space-y-1">
          {product.prices?.map((price, index) => {
            const discount = product.discountPercentage || 0;
            const amount = Number(price.amount);
            const discountedAmount = discount > 0 ? amount * (1 - discount / 100) : amount;
            
            return (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{price.currency}:</span>
                <div className="text-right">
                  {discount > 0 ? (
                    <div>
                      <div className="font-medium text-green-600">{Number(discountedAmount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 line-through">{Number(amount).toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="font-medium text-green-600">{Number(amount).toFixed(2)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`font-medium ${
          product.stock === 0 ? 'text-red-600' : 
          product.stock < 10 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {product.stock || 0}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          product.discountPercentage > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {product.discountPercentage > 0 ? `-${product.discountPercentage}%` : 'No discount'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            (product._count?.orderItems || 0) > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {product._count?.orderItems || 0} {(product._count?.orderItems || 0) === 1 ? 'purchase' : 'purchases'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ToggleSwitch
          checked={product.isActive}
          onChange={() => onToggleStatus(product.id, product.isActive)}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(product.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAddStock(product)}
            className="text-blue-600 hover:text-blue-900"
            title="Add Stock"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit Product"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockIncrement, setStockIncrement] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filterStatus]);

  const fetchProducts = async() => {
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
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `${config.API_BASE_URL}/admin/products?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const productsArray = data.products?.items || data.products || data.items || [];
      console.log('Products API response:', data);
      console.log('Products array:', productsArray);
      console.log('Active products count:', productsArray.filter(p => p.isActive === true).length);
      setProducts(productsArray);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddProduct = async (productData) => {
    try {
      const response = await adminApiService.createProduct(productData);
      if (response.product) {
        setProducts(prev => [response.product, ...prev]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleEditProduct = (product) => {
    console.log('Products - Editing product:', product);
    console.log('Products - Product images:', product.images);
    console.log('Products - Product images type:', typeof product.images);
    console.log('Products - Product images length:', product.images?.length);
    console.log('Products - Product images array check:', Array.isArray(product.images));
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const response = await adminApiService.updateProduct(editingProduct.id, productData);
      if (response.product) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? response.product : p));
        setShowEditModal(false);
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Error updating product:', err);
      throw err; // Re-throw to let modal handle the error
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

  const handleAddStock = async (product) => {
    setSelectedProduct(product);
    setStockIncrement('');
    setShowAddStockModal(true);
  };

  const handleIncrementStock = async () => {
    if (!selectedProduct || !stockIncrement || isNaN(stockIncrement) || parseFloat(stockIncrement) <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const increment = parseInt(stockIncrement);
      const currentStock = selectedProduct.stock || 0;
      const newStock = currentStock + increment;
      
      // Update the product with the new stock
      await adminApiService.updateProduct(selectedProduct.id, {
        stock: newStock
      });
      
      // Update the product in the local state
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, stock: newStock }
          : p
      ));
      
      setShowAddStockModal(false);
      setSelectedProduct(null);
      setStockIncrement('');
      alert(`Successfully added ${increment} units to stock. New total: ${newStock}`);
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleToggleProductStatus = async (productId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update the local state first for immediate UI feedback
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isActive: newStatus }
            : product
        )
      );
      
      // Then make the API call
      await adminApiService.updateProduct(productId, { isActive: newStatus });
    } catch (err) {
      console.error('Error toggling product status:', err);
      setError('Failed to update product status');
      
      // Revert the optimistic update on error
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isActive: currentStatus }
            : product
        )
      );
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = products.findIndex((product) => product.id === active.id);
      const newIndex = products.findIndex((product) => product.id === over.id);

      // Validate that both products exist
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Product not found in current list');
        return;
      }

      const newProducts = arrayMove(products, oldIndex, newIndex);
      setProducts(newProducts);

      // Update order in backend
      try {
        const productOrders = newProducts.map((product, index) => ({
          id: product.id,
          order: index
        }));

        console.log('Updating product order:', productOrders);
        await adminApiService.updateProductOrder(productOrders);
        console.log('Product order updated successfully');
      } catch (error) {
        console.error('Error updating product order:', error);
        // Revert the change on error
        setProducts(products);
        alert('Failed to update product order. Please try again.');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => {
        const productName = typeof value === 'object' ? (value?.en || value?.ar || 'Unnamed Product') : value || 'Unnamed Product';
        
        // Get the primary image or first image from the images array
        const primaryImage = row.images?.find(img => img.isPrimary) || row.images?.[0];
        
        // Construct full image URL
        const imageUrl = primaryImage?.url ? 
          (primaryImage.url.startsWith('http') ? primaryImage.url : `${config.API_BASE_URL.replace('/api', '')}${primaryImage.url}`) : 
          null;
        
        return (
          <div className="flex items-center space-x-3">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Product"
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-xs" style={{ display: imageUrl ? 'none' : 'flex' }}>
                <Package className="h-4 w-4" />
              </div>
            </div>
            
            {/* Product Name */}
            <div className="font-medium text-gray-900">{productName}</div>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value, row) => {
        const discount = row.discountPercentage || 0;
        
        // Handle both new prices array format and old individual price fields
        let prices = [];
        
        if (row.prices && Array.isArray(row.prices)) {
          // New format: prices array
          prices = row.prices;
        } else {
          // Old format: individual price fields
          if (row.priceEGP) prices.push({ currency: 'EGP', amount: row.priceEGP });
          if (row.priceSAR) prices.push({ currency: 'SAR', amount: row.priceSAR });
          if (row.priceAED) prices.push({ currency: 'AED', amount: row.priceAED });
          if (row.priceUSD) prices.push({ currency: 'USD', amount: row.priceUSD });
        }
        
        if (prices.length === 0) {
          return <span className="text-gray-500 text-sm">No price set</span>;
        }
        
        // Create a map of currency to price
        const priceMap = {};
        prices.forEach(price => {
          priceMap[price.currency] = Number(price.amount);
        });
        
        const currencies = ['EGP', 'SAR', 'AED', 'USD'];
        
        return (
          <div className="text-sm space-y-1">
            {currencies.map(currency => {
              const amount = priceMap[currency];
              if (!amount) return null;
              
              const discountedAmount = discount > 0 ? amount * (1 - discount / 100) : amount;
              
              return (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-gray-600">{currency}:</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <div>
                        <div className="font-medium text-green-600">{Number(discountedAmount).toFixed(2)}</div>
                        <div className="text-xs text-gray-500 line-through">{Number(amount).toFixed(2)}</div>
                      </div>
                    ) : (
                      <div className="font-medium text-green-600">{Number(amount).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      },
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
      key: 'discountPercentage',
      label: 'Discount',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {value > 0 ? `-${value}%` : 'No discount'}
        </span>
      ),
    },
    {
      key: 'purchases',
      label: 'Purchases',
      sortable: true,
      render: (value, row) => {
        const purchaseCount = row._count?.orderItems || 0;
        return (
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              purchaseCount > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {purchaseCount} {purchaseCount === 1 ? 'purchase' : 'purchases'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'loyaltyPointsAwarded',
      label: 'Loyalty Points',
      sortable: true,
      render: (value, row) => {
        const awarded = value || 0;
        const required = row.loyaltyPointsRequired || 0;
        
        if (awarded === 0 && required === 0) {
          return (
            <span className="text-gray-500 text-sm">None</span>
          );
        }
        
        return (
          <div className="text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 mr-1">Awarded:</span>
              <span className="font-medium text-purple-600">
                {awarded} pts
              </span>
            </div>
            {required > 0 && (
              <div className="flex items-center">
                <span className="text-gray-600 mr-1">Required:</span>
                <span className="font-medium text-gray-700">
                  {required} pts
                </span>
              </div>
            )}
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
          onChange={() => handleToggleProductStatus(row.id, value)}
        />
      ),
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
            title="Add Stock"
            onClick={() => handleAddStock(row)}
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Edit Product"
            onClick={() => handleEditProduct(row)}
          >
            <Edit className="h-4 w-4" />
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {Array.isArray(products) ? products.filter(p => p.isActive === true).length : 0}
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
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-gymmawy-primary focus:border-gymmawy-primary w-full sm:w-auto"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gymmawy-primary focus:border-gymmawy-primary w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gymmawy-primary hover:bg-gymmawy-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gymmawy-primary w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Products Table with Drag and Drop */}
      <div className="bg-white shadow-sm rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {products.map((product) => (
                    <SortableRow
                      key={product.id}
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onToggleStatus={handleToggleProductStatus}
                      onAddStock={handleAddStock}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        onSave={handleUpdateProduct}
        product={editingProduct}
      />

      {/* Add Stock Modal */}
      {showAddStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-96 max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Stock</h3>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Product: <span className="font-medium text-gray-900">{selectedProduct.name?.en || selectedProduct.name?.ar || 'Unnamed Product'}</span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockIncrement}
                  onChange={(e) => setStockIncrement(e.target.value)}
                  placeholder="Enter positive number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIncrementStock}
                  className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
                >
                  Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
