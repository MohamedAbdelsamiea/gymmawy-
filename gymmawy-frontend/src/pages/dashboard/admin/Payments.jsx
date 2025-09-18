import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Download, CreditCard, Search, Filter, Clock } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import PaymentProofModal from '../../../components/modals/PaymentProofModal';
import adminApiService from '../../../services/adminApiService';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch payments on mount and when server-side filters change
  useEffect(() => {
    fetchPayments();
  }, [filterStatus, filterMethod]);

  // Client-side filtering effect - no API calls, just filtering
  useEffect(() => {
    let filtered = [...payments];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.paymentReference?.toLowerCase().includes(searchLower) ||
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.order?.orderNumber?.toLowerCase().includes(searchLower) ||
        payment.subscription?.subscriptionNumber?.toLowerCase().includes(searchLower) ||
        payment.programmePurchase?.purchaseNumber?.toLowerCase().includes(searchLower) ||
        payment.gatewayId?.toLowerCase().includes(searchLower) ||
        payment.user?.firstName?.toLowerCase().includes(searchLower) ||
        payment.user?.lastName?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.amount?.toString().includes(searchLower) ||
        payment.currency?.toLowerCase().includes(searchLower) ||
        payment.method?.toLowerCase().includes(searchLower) ||
        payment.status?.toLowerCase().includes(searchLower),
      );
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm]);

  const fetchPayments = async() => {
    try {
      setLoading(true);
      setError(null);
      
      // Only send server-side filters (status and method)
      const params = {};
      if (filterStatus !== 'all') {
params.status = filterStatus;
}
      if (filterMethod !== 'all') {
params.method = filterMethod;
}
      
      const response = await adminApiService.getPayments(params);
      console.log('Payments API response:', response);
      setPayments(Array.isArray(response.items) ? response.items : Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async(paymentId) => {
    try {
      await adminApiService.verifyPayment(paymentId);
      fetchPayments(); // Refresh the list
    } catch (err) {
      console.error('Error verifying payment:', err);
    }
  };

  const handleViewPaymentProof = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setIsProcessing(true);
      await adminApiService.approvePayment(paymentId);
      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchPayments(); // Refresh the list
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
      fetchPayments(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleExport = () => {
    try {
      // Export the currently filtered data from the table
      const dataToExport = filteredPayments.map(payment => {
        // Determine purchase reference and type
        let purchaseReference = 'N/A';
        let purchaseType = 'N/A';
        
        if (payment.order) {
          purchaseReference = payment.order.orderNumber;
          purchaseType = 'Order';
        } else if (payment.subscription) {
          purchaseReference = payment.subscription.subscriptionNumber;
          purchaseType = 'Subscription';
        } else if (payment.programmePurchase) {
          purchaseReference = payment.programmePurchase.purchaseNumber;
          purchaseType = 'Programme';
        }

        return {
          'Payment Reference': payment.paymentReference || '',
          'User': payment.user ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() : 'N/A',
          'Email': payment.user?.email || 'N/A',
          'Paymentable Reference': purchaseReference,
          'Paymentable Type': purchaseType,
          'Amount': payment.amount || '0',
          'Currency': payment.currency || 'N/A',
          'Method': payment.method || 'N/A',
          'Gateway ID': payment.gatewayId || 'N/A',
          'Transaction ID': payment.transactionId || 'N/A',
          'Processed At': payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : 'N/A',
          'Status': payment.status || 'N/A',
          'Proof File': payment.paymentProofUrl || payment.proofFile || 'N/A',
        };
      });

      // Convert to CSV
      const csvContent = [
        Object.keys(dataToExport[0] || {}).join(','),
        ...dataToExport.map(row => Object.values(row).map(value => `"${value}"`).join(',')),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting payments:', err);
    }
  };

  const columns = [
    {
      key: 'paymentReference',
      label: 'Payment Reference',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-gray-600 font-semibold">{value}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (value, row) => {
        const user = row.user;
        if (!user) {
return <span className="text-gray-500">N/A</span>;
}
        
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
        return (
          <div>
            <div className="font-medium text-gray-900">{fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        );
      },
    },
    {
      key: 'paymentableReference',
      label: 'Paymentable Reference',
      sortable: true,
      render: (value, row) => {
        const order = row.order;
        const subscription = row.subscription;
        const programmePurchase = row.programmePurchase;
        
        if (order) {
          return (
            <div className="font-mono text-sm text-blue-600 font-semibold">
              {order.orderNumber}
            </div>
          );
        } else if (subscription) {
          return (
            <div className="font-mono text-sm text-purple-600 font-semibold">
              {subscription.subscriptionNumber}
            </div>
          );
        } else if (programmePurchase) {
          return (
            <div className="font-mono text-sm text-orange-600 font-semibold">
              {programmePurchase.purchaseNumber}
            </div>
          );
        }
        
        return <span className="text-gray-500">N/A</span>;
      },
    },
    {
      key: 'paymentableType',
      label: 'Paymentable Type',
      sortable: true,
      render: (value, row) => {
        const order = row.order;
        const subscription = row.subscription;
        const programmePurchase = row.programmePurchase;
        
        if (order) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Order
            </span>
          );
        } else if (subscription) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Subscription
            </span>
          );
        } else if (programmePurchase) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Programme
            </span>
          );
        }
        
        return <span className="text-gray-500">N/A</span>;
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => (
        <span className="font-semibold">
          {value} {row.currency}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: 'gatewayId',
      label: 'Gateway ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-gray-600">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-gray-600">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'processedAt',
      label: 'Processed At',
      sortable: true,
      render: (value, row) => {
        if (!value) {
          return (
            <div className="text-sm">
              <div className="text-gray-400">Not processed</div>
              {row.status === 'PENDING' && (
                <div className="text-xs text-yellow-600">Awaiting processing</div>
              )}
            </div>
          );
        }
        
        const processedDate = new Date(value);
        const daysAgo = Math.floor((Date.now() - processedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="text-sm">
            <div className="text-gray-900 font-medium">
              {processedDate.toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">
              {daysAgo === 0 ? 'Today' : 
               daysAgo === 1 ? 'Yesterday' : 
               `${daysAgo} days ago`}
            </div>
            <div className="text-xs text-gray-400">
              {processedDate.toLocaleTimeString()}
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
          'SUCCESS': 'bg-green-100 text-green-800',
          'FAILED': 'bg-red-100 text-red-800',
          'REFUNDED': 'bg-blue-100 text-blue-800',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'proofFile',
      label: 'Proof File',
      sortable: false,
      render: (value, row) => {
        const proofUrl = row.paymentProofUrl || value;
        if (!proofUrl) {
          return <span className="text-gray-500">N/A</span>;
        }
        
        return (
          <button
            onClick={() => handleViewPaymentProof(row)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
            title="Click to view payment proof and approve/reject"
          >
            <Eye className="w-3 h-3" />
            View Proof
          </button>
        );
      },
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
          onClick={fetchPayments}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage all payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(filteredPayments) ? filteredPayments.filter(p => p.status === 'SUCCESS').length : 0}
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
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(filteredPayments) ? filteredPayments.filter(p => p.status === 'PENDING').length : 0}
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
              <p className="text-sm font-medium text-gray-600">Failed Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(filteredPayments) ? filteredPayments.filter(p => p.status === 'FAILED').length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">
              {filteredPayments.length}
            </span> of <span className="font-medium text-gray-900">
              {payments.length}
            </span> payments
          </div>
          {(searchTerm || filterStatus !== 'all' || filterMethod !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterMethod('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Payments Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(filteredPayments) ? filteredPayments : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payments..."
        filters={[
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "SUCCESS", label: "Success" },
              { value: "PENDING", label: "Pending" },
              { value: "FAILED", label: "Failed" },
              { value: "REFUNDED", label: "Refunded" },
            ],
          },
          {
            label: "Method",
            value: filterMethod,
            onChange: setFilterMethod,
            options: [
              { value: "all", label: "All Methods" },
              { value: "CARD", label: "Card" },
              { value: "TABBY", label: "Tabby" },
              { value: "TAMARA", label: "Tamara" },
              { value: "VODAFONE_CASH", label: "Vodafone Cash" },
              { value: "INSTAPAY", label: "InstaPay" },
              { value: "OTHER", label: "Other" },
            ],
          },
        ]}
        onApplyFilters={fetchPayments}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
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
    </div>
  );
};

export default AdminPayments;
