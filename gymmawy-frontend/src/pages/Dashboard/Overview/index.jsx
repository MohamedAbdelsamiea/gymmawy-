import React from 'react';

const Overview = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
          <p className="text-3xl font-bold text-indigo-600">24</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Reward Points</h3>
          <p className="text-3xl font-bold text-yellow-600">1,250</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Spent</h3>
          <p className="text-3xl font-bold text-purple-600">$450</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">Order #1234 completed</span>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">Subscription renewed</span>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-700">Earned 50 reward points</span>
            <span className="text-sm text-gray-500">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
