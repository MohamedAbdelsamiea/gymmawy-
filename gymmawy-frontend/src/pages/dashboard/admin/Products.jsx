import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Package, Tag, Search, Filter, Download, CheckCircle, XCircle, PlusCircle, X } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import AddProductModal from '../../../components/dashboard/AddProductModal';
import EditProductModal from '../../../components/dashboard/EditProductModal';
import adminApiService from '../../../services/adminApiService';
import productService from '../../../services/productService';

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
  const [currentStock, setCurrentStock] = useState(0);
  const [refreshingStock, setRefreshingStock] = useState(false);

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
      const url = `http://localhost:3000/api/admin/products?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      console.log('Products API response:', data);
      const productsArray = data.products?.items || data.products || data.items || [];
      console.log('First product data:', productsArray[0]);
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
    setCurrentStock(product.stock || 0);
    setShowAddStockModal(true);
    
    // Fetch the latest stock data
    await refreshCurrentStock(product.id);
  };

  const refreshCurrentStock = async (productId) => {
    try {
      setRefreshingStock(true);
      const latestProduct = await adminApiService.getProductById(productId);
      const latestStock = latestProduct.product?.stock || 0;
      setCurrentStock(latestStock);
    } catch (err) {
      console.error('Error refreshing stock:', err);
    } finally {
      setRefreshingStock(false);
    }
  };

  const handleIncrementStock = async () => {
    if (!selectedProduct || !stockIncrement || isNaN(stockIncrement) || parseFloat(stockIncrement) <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const increment = parseInt(stockIncrement);
      
      // Use the current stock from state (which is refreshed when modal opens)
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
      alert(`Successfully added ${increment} units to stock. Previous stock: ${currentStock}, New stock: ${newStock}`);
    } catch (err) {
      console.error('Error updating stock:', err);
      if (err.message?.includes('stock')) {
        alert('Stock update failed. The product stock may have changed. Please refresh and try again.');
      } else {
        alert('Failed to update stock. Please try again.');
      }
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
          (primaryImage.url.startsWith('http') ? primaryImage.url : `http://localhost:3000${primaryImage.url}`) : 
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Stock</h3>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Product: <span className="font-medium">{selectedProduct.name?.en || selectedProduct.name?.ar || 'Unnamed Product'}</span>
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Current Stock: <span className="font-medium text-blue-600">{refreshingStock ? '...' : currentStock}</span>
                </p>
                <button
                  onClick={() => refreshCurrentStock(selectedProduct.id)}
                  disabled={refreshingStock}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {refreshingStock ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {stockIncrement && !isNaN(stockIncrement) && parseFloat(stockIncrement) > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  New stock will be: <span className="font-medium text-green-600">
                    {currentStock + parseInt(stockIncrement)}
                  </span>
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddStockModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIncrementStock}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
