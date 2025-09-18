import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Search, Filter, Download, Plus } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const AdminShipping = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchShipments();
  }, [searchTerm, filterStatus]);

  const fetchShipments = async() => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockShipments = [
        {
          id: 'SH001',
          orderId: 'ORD001',
          trackingNumber: 'TRK123456789',
          status: 'IN_TRANSIT',
          carrier: 'DHL',
          destination: '123 Main St, New York, NY 10001',
          estimatedDelivery: '2024-01-15',
          actualDelivery: null,
          createdAt: '2024-01-10',
        },
        {
          id: 'SH002',
          orderId: 'ORD002',
          trackingNumber: 'TRK987654321',
          status: 'DELIVERED',
          carrier: 'FedEx',
          destination: '456 Oak Ave, Los Angeles, CA 90210',
          estimatedDelivery: '2024-01-12',
          actualDelivery: '2024-01-11',
          createdAt: '2024-01-08',
        },
      ];
      
      let data = Array.isArray(mockShipments) ? mockShipments : [];
      if (searchTerm && Array.isArray(data)) {
        data = data.filter(shipment =>
          shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      if (filterStatus !== 'all' && Array.isArray(data)) {
        data = data.filter(shipment => shipment.status === filterStatus);
      }
      
      setShipments(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackShipment = async(trackingNumber) => {
    try {
      const response = await adminApiService.trackShipment(trackingNumber);
      console.log('Tracking info:', response);
    } catch (err) {
      console.error('Error tracking shipment:', err);
    }
  };

  const handleGenerateLabel = async(orderId) => {
    try {
      const response = await adminApiService.generateShippingLabel(orderId, {
        // Add label data
      });
      console.log('Generated label:', response);
    } catch (err) {
      console.error('Error generating label:', err);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Shipment ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      ),
    },
    {
      key: 'orderId',
      label: 'Order ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      ),
    },
    {
      key: 'trackingNumber',
      label: 'Tracking Number',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: 'carrier',
      label: 'Carrier',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'DELIVERED' ? 'bg-green-100 text-green-800' :
          value === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
          value === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      sortable: false,
      render: (value) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          <MapPin className="h-3 w-3 inline mr-1" />
          {value}
        </div>
      ),
    },
    {
      key: 'estimatedDelivery',
      label: 'Est. Delivery',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actualDelivery',
      label: 'Actual Delivery',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 text-gray-400 hover:text-blue-600" 
            title="Track Shipment"
            onClick={() => handleTrackShipment(row.trackingNumber)}
          >
            <Truck className="h-4 w-4" />
          </button>
          <button 
            className="p-1 text-gray-400 hover:text-green-600" 
            title="Generate Label"
            onClick={() => handleGenerateLabel(row.orderId)}
          >
            <Package className="h-4 w-4" />
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
          onClick={fetchShipments}
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
          <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
          <p className="text-gray-600 mt-1">Track shipments and manage shipping operations</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Package className="h-4 w-4 mr-2" />
          Create Shipment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{Array.isArray(shipments) ? shipments.length : 0}</div>
          <div className="text-sm text-gray-600">Total Shipments</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {Array.isArray(shipments) ? shipments.filter(s => s.status === 'IN_TRANSIT').length : 0}
          </div>
          <div className="text-sm text-gray-600">In Transit</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {Array.isArray(shipments) ? shipments.filter(s => s.status === 'DELIVERED').length : 0}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {Array.isArray(shipments) ? shipments.filter(s => s.status === 'SHIPPED').length : 0}
          </div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
      </div>

      {/* Shipments Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(shipments) ? shipments : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search shipments..."
        filters={[
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "IN_TRANSIT", label: "In Transit" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "FAILED", label: "Failed" },
            ],
          },
        ]}
        onApplyFilters={fetchShipments}
        onExport={() => {}}
        showApplyButton={false}
        showExportButton={false}
        applyButtonText="Apply Filters"
      />
    </div>
  );
};

export default AdminShipping;
