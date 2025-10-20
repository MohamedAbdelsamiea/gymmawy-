import React, { useState } from 'react';
import { Gift, Award, TrendingUp, Clock, Star } from 'lucide-react';
import { StatCard, StatusBadge } from '../../../components/dashboard';
import { getGymmawyCoinIcon } from '../../../utils/currencyUtils';

const UserLoyaltyPoints = () => {
  const [activeTab, setActiveTab] = useState('rewards');

  const userPoints = {
    current: 1250,
    totalEarned: 2500,
    totalRedeemed: 1250,
    level: 'Gold',
    nextLevel: 'Platinum',
    pointsToNext: 750
  };

  const [transactions] = useState([
    {
      id: 'TXN001',
      type: 'Earned',
      points: 150,
      reason: 'Purchase - Premium Plan',
      date: '2024-01-20',
      status: 'Completed'
    },
    {
      id: 'TXN002',
      type: 'Redeemed',
      points: -100,
      reason: '10% Discount Coupon',
      date: '2024-01-19',
      status: 'Completed'
    },
    {
      id: 'TXN003',
      type: 'Bonus',
      points: 50,
      reason: 'Referral Bonus',
      date: '2024-01-18',
      status: 'Completed'
    },
    {
      id: 'TXN004',
      type: 'Earned',
      points: 25,
      reason: 'Workout Completion',
      date: '2024-01-17',
      status: 'Completed'
    }
  ]);

  const [availableRewards] = useState([
    {
      id: 'REW001',
      name: '10% Discount',
      pointsRequired: 100,
      description: 'Get 10% off your next purchase',
      category: 'Discount',
      validUntil: '2024-12-31'
    },
    {
      id: 'REW002',
      name: 'Free Shipping',
      pointsRequired: 50,
      description: 'Free shipping on your next order',
      category: 'Shipping',
      validUntil: '2024-12-31'
    },
    {
      id: 'REW003',
      name: 'Premium Upgrade',
      pointsRequired: 500,
      description: 'Upgrade to premium plan for 1 month',
      category: 'Subscription',
      validUntil: '2024-12-31'
    },
    {
      id: 'REW004',
      name: 'Personal Training Session',
      pointsRequired: 1000,
      description: 'One-on-one training session with expert',
      category: 'Service',
      validUntil: '2024-12-31'
    }
  ]);

  const [userRanking] = useState({
    currentRank: 15,
    totalUsers: 1250,
    percentile: 98.8
  });

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
      sortable: true
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    }
  ];

  const handleRedeem = (reward) => {
    // Redeeming reward
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gymmawy Coins</h1>
          <p className="text-gray-600 mt-1">Manage your coins and rewards</p>
        </div>
      </div>

      {/* Points Overview */}
      <div className="bg-gradient-to-r from-gymmawy-primary to-gymmawy-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">{userPoints.current.toLocaleString()}</h2>
            <p className="text-gymmawy-light opacity-90">Current Gymmawy Coins</p>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              {getGymmawyCoinIcon({ size: 24, className: "mr-2" })}
              <span className="text-lg font-semibold">{userPoints.level} Member</span>
            </div>
            <p className="text-sm text-gymmawy-light opacity-90">
              {userPoints.pointsToNext} gymmawy coins to {userPoints.nextLevel}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(userPoints.current / (userPoints.current + userPoints.pointsToNext)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Earned"
          value={userPoints.totalEarned.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Redeemed"
          value={userPoints.totalRedeemed.toLocaleString()}
          icon={() => getGymmawyCoinIcon({ size: 20 })}
          color="purple"
        />
        <StatCard
          title="Your Ranking"
          value={`#${userPoints.currentRank}`}
          change={`Top ${userPoints.percentile}%`}
          changeType="positive"
          icon={Star}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rewards'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {getGymmawyCoinIcon({ size: 16, className: "inline mr-2" })}
            Available Rewards
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-gymmawy-primary text-gymmawy-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Transaction History
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'rewards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                <span className="text-sm font-medium text-orange-600">{reward.pointsRequired} pts</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {reward.category}
                </span>
                <span className="text-xs text-gray-500">
                  Valid until {reward.validUntil}
                </span>
              </div>
              
              <button
                onClick={() => handleRedeem(reward)}
                disabled={userPoints.current < reward.pointsRequired}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  userPoints.current >= reward.pointsRequired
                    ? 'bg-gymmawy-primary text-white hover:bg-gymmawy-secondary'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {userPoints.current >= reward.pointsRequired ? 'Redeem Now' : 'Not Enough Coins'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {transactionColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      {transactionColumns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.render ? column.render(transaction[column.key], transaction) : transaction[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoyaltyPoints;
