import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Users, UserCheck, UserX, Clock, Shield, UserPlus } from 'lucide-react';
import { DataTable, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';
import AddAdminModal from '../../../components/modals/AddAdminModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Fetch users on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  // Client-side filtering effect - no API calls, just filtering
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.mobileNumber?.toLowerCase().includes(searchLower) ||
        user.city?.toLowerCase().includes(searchLower) ||
        user.country?.toLowerCase().includes(searchLower) ||
        user.street?.toLowerCase().includes(searchLower) ||
        user.building?.toLowerCase().includes(searchLower) ||
        user.postcode?.toLowerCase().includes(searchLower),
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }


    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  const fetchUsers = async() => {
    try {
      setLoading(true);
      setError(null);
      
      // Only send server-side filters (role)
      const params = {};
      if (filterRole !== 'all') {
params.role = filterRole;
}
      
      const response = await adminApiService.getUsers(params);
      // Handle response structure: { items: [...], total: 2, page: 1, pageSize: 10 }
      const usersData = response.items || response;
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async(userId, userData) => {
    try {
      await adminApiService.updateUser(userId, userData);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };


  const handleExport = () => {
    try {
      // Export the currently filtered data from the table
      const dataToExport = filteredUsers.map(user => ({
        'First Name': user.firstName || '',
        'Last Name': user.lastName || '',
        'Email': user.email || '',
        'Mobile': user.mobileNumber || '',
        'Date of Birth': user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '',
        'Role': user.role || '',
        'Loyalty Points': user.loyaltyPoints || 0,
        'Building': user.building || '',
        'Street': user.street || '',
        'City': user.city || '',
        'Country': user.country || '',
        'Postcode': user.postcode || '',
        'Joined': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        'Last Active': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
      }));

      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(','),
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting users:', err);
    }
  };

  const columns = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      sortFunction: (a, b, direction) => {
        // Create full names for comparison
        const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        
        if (aName < bName) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aName > bName) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      },
      render: (_, row) => (
        <div className="font-medium text-gray-900">
          {row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : 
           row.firstName || row.lastName || 'No Name'}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value}
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Mobile',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'birthDate',
      label: 'Date of Birth',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'ADMIN' ? 'bg-red-100 text-red-800' :
          value === 'MEMBER' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'loyaltyPoints',
      label: 'Loyalty Points',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <div className="font-medium text-green-600">{value || 0}</div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: false,
      render: (_, row) => {
        const addressParts = [];
        if (row.building) {
addressParts.push(row.building);
}
        if (row.street) {
addressParts.push(row.street);
}
        if (row.city) {
addressParts.push(row.city);
}
        if (row.country) {
addressParts.push(row.country);
}
        if (row.postcode) {
addressParts.push(row.postcode);
}
        
        return (
          <div className="text-sm">
            {addressParts.length > 0 ? (
              <div>
                <div className="font-medium">{addressParts.slice(0, 2).join(', ')}</div>
                {addressParts.length > 2 && (
                  <div className="text-xs text-gray-500">
                    {addressParts.slice(2).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">
            {Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </div>
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Last Active',
      sortable: true,
      render: (value) => {
        if (!value) {
return <span className="text-gray-400">Never</span>;
}
        const daysAgo = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="text-sm">
            <div>{new Date(value).toLocaleDateString()}</div>
            <div className={`text-xs ${daysAgo > 30 ? 'text-red-500' : daysAgo > 7 ? 'text-yellow-500' : 'text-green-500'}`}>
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
            </div>
          </div>
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
          onClick={fetchUsers}
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
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">View all platform users and their information</p>
        </div>
        <button
          onClick={() => setShowAddAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(users) ? users.filter(u => u.role === 'ADMIN').length : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Joined This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {Array.isArray(users) ? users.filter(u => u.createdAt && new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredUsers.length}</span> of <span className="font-medium text-gray-900">{users.length}</span> users
          </div>
          {(searchTerm || filterRole !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
              }}
              className="text-sm text-gymmawy-primary hover:text-gymmawy-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table with Integrated Filters */}
      <TableWithFilters
        data={Array.isArray(filteredUsers) ? filteredUsers : []}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search users..."
        filters={[
          {
            label: "Role",
            value: filterRole,
            onChange: setFilterRole,
            options: [
              { value: "all", label: "All Roles" },
              { value: "ADMIN", label: "Admin" },
              { value: "MEMBER", label: "Member" },
            ],
          },
        ]}
        onApplyFilters={fetchUsers}
        onExport={handleExport}
        showApplyButton={false}
        showExportButton={true}
        exportButtonText="Export"
      />

      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        onSuccess={() => {
          fetchUsers(); // Refresh the users list
        }}
      />

    </div>
  );
};

export default AdminUsers;
