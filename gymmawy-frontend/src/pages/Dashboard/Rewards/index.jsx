import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import referralService from '../../../services/referralService';

const Rewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [referralRewards, referralConfig] = await Promise.allSettled([
        referralService.getReferralRewards(),
        referralService.getReferralConfig()
      ]);

      // Process referral rewards
      if (referralRewards.status === 'fulfilled' && referralRewards.value?.data) {
        const totalPoints = referralRewards.value.data.reduce((sum, reward) => sum + (reward.points || 0), 0);
        setUserPoints(totalPoints);
      }

      // Get available rewards from config or use fallback
      if (referralConfig.status === 'fulfilled' && referralConfig.value?.data?.rewards) {
        setRewards(referralConfig.value.data.rewards);
      } else {
        // Fallback rewards
        setRewards([
          {
            id: '1',
            name: 'Free Personal Training Session',
            points: 500,
            description: 'Get a free 1-hour personal training session with our certified trainers',
            category: 'Training',
            available: true
          },
          {
            id: '2',
            name: '50% Off Store Items',
            points: 300,
            description: 'Get 50% off any item in our store (up to $50 value)',
            category: 'Store',
            available: true
          },
          {
            id: '3',
            name: 'Free Month Membership',
            points: 1000,
            description: 'Get one month of gym membership for free',
            category: 'Membership',
            available: false
          },
          {
            id: '4',
            name: 'Nutrition Consultation',
            points: 200,
            description: 'Free 30-minute consultation with our nutritionist',
            category: 'Nutrition',
            available: true
          }
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId) => {
    try {
      // Implement reward redemption logic
      alert('Reward redemption feature coming soon!');
    } catch (error) {
      alert(`Failed to redeem reward: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={loadRewardsData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Rewards & Points</h1>
      
      {/* Points Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Your Points Balance</h2>
        <p className="text-4xl font-bold">{userPoints}</p>
        <p className="text-indigo-100">Keep earning points with every purchase and activity!</p>
      </div>
      
      {/* Available Rewards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rewards</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {rewards.map((reward) => (
            <div key={reward.id} className={`bg-white shadow rounded-lg p-6 border-2 ${
              reward.available ? 'border-green-200' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{reward.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{reward.category}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  reward.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {reward.available ? 'Available' : 'Not Available'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{reward.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Cost:</span>
                  <span className="text-lg font-bold text-indigo-600">{reward.points} points</span>
                </div>
                
                {reward.available && userPoints >= reward.points ? (
                  <button 
                    onClick={() => handleRedeemReward(reward.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Redeem
                  </button>
                ) : (
                  <button 
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                  >
                    {userPoints < reward.points ? 'Not Enough Points' : 'Unavailable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* How to Earn Points */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Earn Points</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">$</span>
            </div>
            <div>
              <p className="font-medium">Store Purchases</p>
              <p className="text-sm text-gray-500">1 point per $1 spent</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">🏋️</span>
            </div>
            <div>
              <p className="font-medium">Gym Visits</p>
              <p className="text-sm text-gray-500">10 points per visit</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">⭐</span>
            </div>
            <div>
              <p className="font-medium">Referrals</p>
              <p className="text-sm text-gray-500">100 points per referral</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">📅</span>
            </div>
            <div>
              <p className="font-medium">Monthly Check-ins</p>
              <p className="text-sm text-gray-500">50 points per month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
