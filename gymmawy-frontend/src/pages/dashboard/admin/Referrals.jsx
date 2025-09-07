import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, Share2, Users, Gift, TrendingUp, Search } from 'lucide-react';
import { DataTable, StatusBadge, TableWithFilters } from '../../../components/dashboard';
import adminApiService from '../../../services/adminApiService';

const AdminReferrals = () => {
  const [referralCodes, setReferralCodes] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReferralData();
  }, [searchTerm]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch referral codes, analytics, and rewards
      const [codesResponse, analyticsResponse, rewardsResponse] = await Promise.all([
        adminApiService.getReferralCodes(),
        adminApiService.getReferralAnalytics(),
        adminApiService.getReferralRewards()
      ]);
      
      let codesData = Array.isArray(codesResponse.data) ? codesResponse.data : Array.isArray(codesResponse) ? codesResponse : [];
      if (searchTerm && Array.isArray(codesData)) {
        codesData = codesData.filter(code =>
          code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          code.userName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setReferralCodes(codesData);
      setAnalytics(Array.isArray(analyticsResponse.data) ? analyticsResponse.data : Array.isArray(analyticsResponse) ? analyticsResponse : []);
      setRewards(Array.isArray(rewardsResponse.data) ? rewardsResponse.data : Array.isArray(rewardsResponse) ? rewardsResponse : []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateCode = async (code) => {
    if (window.confirm('Are you sure you want to deactivate this referral code?')) {
      try {
        await adminApiService.deactivateReferralCode(code);
        fetchReferralData();
      } catch (err) {
        console.error('Error deactivating referral code:', err);
      }
    }
  };

  const handleGenerateCode = async (userId) => {
    try {
      await adminApiService.generateReferralCode(userId);
      fetchReferralData();
    } catch (err) {
      console.error('Error generating referral code:', err);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Code ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'code',
      label: 'Referral Code',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {value}
        </span>
      )
    },
    {
      key: 'userName',
      label: 'Owner',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      key: 'usageCount',
      label: 'Usage Count',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Users className="h-3 w-3 mr-1" />
          {value || 0}
        </span>
      )
    },
    {
      key: 'totalRewards',
      label: 'Total Rewards',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-green-600">${value || '0.00'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
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
            className="p-1 text-gray-400 hover:text-red-600" 
            title="Deactivate Code"
            onClick={() => handleDeactivateCode(row.code)}
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
          onClick={fetchReferralData}
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
          <h1 className="text-2xl font-bold text-gray-900">Referral System</h1>
          <p className="text-gray-600 mt-1">Manage referral codes, track analytics, and monitor rewards</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Generate Code
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{referralCodes.length}</div>
          <div className="text-sm text-gray-600">Total Referral Codes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {analytics.totalReferrals || 0}
          </div>
          <div className="text-sm text-gray-600">Total Referrals</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.totalRewards || 0}
          </div>
          <div className="text-sm text-gray-600">Total Rewards Given</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {analytics.conversionRate || 0}%
          </div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>

      {/* Referral Codes Table with Integrated Filters */}
      <TableWithFilters
        data={referralCodes}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search codes..."
        filters={[]}
        onApplyFilters={() => {}}
        onExport={() => {}}
        showApplyButton={false}
        showExportButton={false}
      />

      {/* Rewards Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Rewards</h3>
        </div>
        <div className="p-6">
          {Array.isArray(rewards) && rewards.length > 0 ? (
            <div className="space-y-4">
              {rewards.slice(0, 5).map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{reward.userName}</div>
                      <div className="text-sm text-gray-600">Referral reward</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">${reward.amount}</div>
                    <div className="text-sm text-gray-600">{new Date(reward.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No rewards given yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReferrals;
