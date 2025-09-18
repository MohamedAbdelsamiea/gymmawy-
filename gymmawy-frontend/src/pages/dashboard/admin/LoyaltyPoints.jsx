import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Gift, Award, TrendingUp } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../components/dashboard';

const LoyaltyPoints = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  const [transactions] = useState([
    {
      id: 'TXN001',
      user: 'Ahmed Mohamed',
      email: 'ahmed@example.com',
      type: 'Earned',
      points: 150,
      reason: 'Purchase - Premium Plan',
      date: '2024-01-20',
      balance: 1250
    },
    {
      id: 'TXN002',
      user: 'Sarah Ali',
      email: 'sarah@example.com',
      type: 'Redeemed',
      points: -100,
      reason: 'Redeemed for Discount',
      date: '2024-01-19',
      balance: 890
    },
    {
      id: 'TXN003',
      user: 'Omar Hassan',
      email: 'omar@example.com',
      type: 'Bonus',
      points: 50,
      reason: 'Referral Bonus',
      date: '2024-01-18',
      balance: 450
    },
    {
      id: 'TXN004',
      user: 'Fatima Ahmed',
      email: 'fatima@example.com',
      type: 'Adjusted',
      points: 25,
      reason: 'Admin Adjustment',
      date: '2024-01-17',
      balance: 675
    }
  ]);

  const [rewards] = useState([
    {
      id: 'REW001',
      name: '10% Discount',
      pointsRequired: 100,
      description: 'Get 10% off your next purchase',
      status: 'Active',
      usageCount: 45,
      maxUsage: 100
    },
    {
      id: 'REW002',
      name: 'Free Shipping',
      pointsRequired: 50,
      description: 'Free shipping on your next order',
      status: 'Active',
      usageCount: 23,
      maxUsage: 50
    },
    {
      id: 'REW003',
      name: 'Premium Upgrade',
      pointsRequired: 500,
      description: 'Upgrade to premium plan for 1 month',
      status: 'Active',
      usageCount: 8,
      maxUsage: 20
    }
  ]);

  const [topUsers] = useState([
    {
      id: 'USER001',
      name: 'Ahmed Mohamed',
      email: 'ahmed@example.com',
      totalPoints: 1250,
      rank: 1,
      joinDate: '2023-06-15'
    },
    {
      id: 'USER002',
      name: 'Sarah Ali',
      email: 'sarah@example.com',
      totalPoints: 890,
      rank: 2,
      joinDate: '2023-08-20'
    },
    {
      id: 'USER003',
      name: 'Omar Hassan',
      email: 'omar@example.com',
      totalPoints: 450,
      rank: 3,
      joinDate: '2023-09-10'
    }
  ]);

  const transactionColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'points',
      label: 'Points',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value > 0 ? '+' : ''}{value}
        </span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
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
      )
    }
  ];

  const rewardColumns = [
    {
      key: 'id',
      label: 'Reward ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gymmawy-primary">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Reward Name',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'pointsRequired',
      label: 'Points Required',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-orange-600">{value}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'usageCount',
      label: 'Usage',
      sortable: true,
      render: (value, row) => (
        <span className="font-medium">
          {value}/{row.maxUsage}
        </span>
      )
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
      )
    }
  ];

  const topUserColumns = [
    {
      key: 'rank',
      label: 'Rank',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          {value === 1 && <Award className="h-4 w-4 text-yellow-500 mr-1" />}
          {value === 2 && <Award className="h-4 w-4 text-gray-400 mr-1" />}
          {value === 3 && <Award className="h-4 w-4 text-orange-500 mr-1" />}
          <span className="font-medium">#{value}</span>
        </div>
      )
    },
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'totalPoints',
      label: 'Total Points',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-purple-600">{value}</span>
      )
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  const handleExport = (data) => {
    // Exporting loyalty data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Points Management</h1>
          <p className="text-gray-600 mt-1">Track and manage loyalty points and rewards</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Reward
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rewards'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Gift className="h-4 w-4 inline mr-2" />
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('topUsers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'topUsers'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Award className="h-4 w-4 inline mr-2" />
            Top Users
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">12,450</div>
          <div className="text-sm text-gray-600">Total Points Issued</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">3,250</div>
          <div className="text-sm text-gray-600">Points Redeemed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">156</div>
          <div className="text-sm text-gray-600">Active Rewards</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">89</div>
          <div className="text-sm text-gray-600">Rewards Claimed</div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'transactions' && (
        <DataTable
          data={transactions}
          columns={transactionColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      )}
      
      {activeTab === 'rewards' && (
        <DataTable
          data={rewards}
          columns={rewardColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      )}
      
      {activeTab === 'topUsers' && (
        <DataTable
          data={topUsers}
          columns={topUserColumns}
          searchable={true}
          filterable={true}
          exportable={true}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default LoyaltyPoints;
