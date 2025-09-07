import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Users, Phone, Mail, Calendar, Search, Filter, Download, UserPlus, MessageSquare, CheckCircle } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import leadService from '../../../services/leadService';

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [leadsStats, setLeadsStats] = useState(null);

  useEffect(() => {
    fetchLeads();
    fetchLeadsStats();
  }, []);

  // Client-side filtering effect
  useEffect(() => {
    let filtered = [...leads];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.mobileNumber?.toLowerCase().includes(searchLower) ||
        lead.message?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, filterStatus, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await leadService.getLeads();
      setLeads(Array.isArray(response.items) ? response.items : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsStats = async () => {
    try {
      const response = await adminApiService.getLeadsStats();
      setLeadsStats(response);
    } catch (err) {
      console.error('Error fetching leads stats:', err);
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await leadService.updateLeadStatus(leadId, newStatus);
      fetchLeads();
      fetchLeadsStats();
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(leadId);
        fetchLeads();
        fetchLeadsStats();
      } catch (err) {
        console.error('Error deleting lead:', err);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await leadService.exportLeads();
      // Create a download link for the exported file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting leads:', err);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Lead ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Contact',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'N/A'}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Mail className="h-3 w-3 mr-1" />
            {row.email || 'N/A'}
          </div>
          {row.mobileNumber && (
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {row.mobileNumber}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'NEW' ? 'bg-blue-100 text-blue-800' :
          value === 'CONTACTED' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'message',
      label: 'Message',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 max-w-xs truncate">{value || 'N/A'}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          {row.status === 'NEW' && (
            <button 
              className="p-1 text-gray-400 hover:text-green-600" 
              title="Mark as Contacted"
              onClick={() => handleUpdateLeadStatus(row.id, 'CONTACTED')}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {row.status === 'CONTACTED' && (
            <button 
              className="p-1 text-gray-400 hover:text-blue-600" 
              title="Mark as New"
              onClick={() => handleUpdateLeadStatus(row.id, 'NEW')}
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <button 
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Delete Lead"
            onClick={() => handleDeleteLead(row.id)}
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
          onClick={fetchLeads}
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
        <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
        <p className="text-gray-600 mt-1">Track and manage potential customers and leads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {leadsStats?.totalLeads || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {leadsStats?.newLeads || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contacted Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {leadsStats?.contactedLeads || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredLeads.length}</span> of <span className="font-medium text-gray-900">{leads.length}</span> leads
          </div>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(filteredLeads) ? filteredLeads : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search leads..."
        filters={[
          {
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "all", label: "All Status" },
              { value: "NEW", label: "New" },
              { value: "CONTACTED", label: "Contacted" }
            ]
          }
        ]}
        onApplyFilters={fetchLeads}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        applyButtonText="Apply Filters"
        exportButtonText="Export"
      />
    </div>
  );
};

export default AdminLeads;