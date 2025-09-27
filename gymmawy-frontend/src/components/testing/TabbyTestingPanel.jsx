import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';

const TabbyTestingPanel = ({ onTestCredentialsSelect, isVisible, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState('payment_success');
  const [selectedCountry, setSelectedCountry] = useState('KSA');

  const testCredentials = {
    payment_success: {
      UAE: { email: 'otp.success@tabby.ai', phone: '+971500000001' },
      KSA: { email: 'otp.success@tabby.ai', phone: '+966500000001' },
      KUWAIT: { email: 'otp.success@tabby.ai', phone: '+96590000001' }
    },
    background_reject: {
      UAE: { email: 'otp.success@tabby.ai', phone: '+971500000002' },
      KSA: { email: 'otp.success@tabby.ai', phone: '+966500000002' },
      KUWAIT: { email: 'otp.success@tabby.ai', phone: '+96590000002' }
    },
    payment_failure: {
      UAE: { email: 'otp.rejected@tabby.ai', phone: '+971500000001' },
      KSA: { email: 'otp.rejected@tabby.ai', phone: '+966500000001' },
      KUWAIT: { email: 'otp.rejected@tabby.ai', phone: '+96590000001' }
    },
    corner_case: {
      UAE: { email: 'otp.success@tabby.ai', phone: '+971500000001' },
      KSA: { email: 'otp.success@tabby.ai', phone: '+966500000001' },
      KUWAIT: { email: 'otp.success@tabby.ai', phone: '+96590000001' }
    }
  };

  const scenarios = [
    {
      id: 'payment_success',
      name: 'Payment Success',
      description: 'Complete payment flow with OTP: 8888',
      color: 'green'
    },
    {
      id: 'background_reject',
      name: 'Background Pre-scoring Reject',
      description: 'Tabby payment method should be hidden/unavailable',
      color: 'red'
    },
    {
      id: 'payment_cancel',
      name: 'Payment Cancellation',
      description: 'User cancels payment, should redirect to cancel page',
      color: 'yellow'
    },
    {
      id: 'payment_failure',
      name: 'Payment Failure',
      description: 'Payment rejected by Tabby, should show failure message',
      color: 'red'
    },
    {
      id: 'corner_case',
      name: 'Corner Case',
      description: 'Close browser tab after success, test webhook handling',
      color: 'blue'
    }
  ];

  const handleApplyCredentials = () => {
    const credentials = testCredentials[selectedScenario][selectedCountry];
    onTestCredentialsSelect(credentials, selectedScenario);
    showToast('Test credentials applied!', 'success');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tabby Testing Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Test Scenario Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Scenario
            </label>
            <div className="grid grid-cols-1 gap-2">
              {scenarios.map((scenario) => (
                <label key={scenario.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="scenario"
                    value={scenario.id}
                    checked={selectedScenario === scenario.id}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{scenario.name}</div>
                    <div className="text-sm text-gray-500">{scenario.description}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full bg-${scenario.color}-500`}></div>
                </label>
              ))}
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UAE">UAE</option>
              <option value="KSA">KSA (Saudi Arabia)</option>
              <option value="KUWAIT">Kuwait</option>
            </select>
          </div>

          {/* Test Credentials Display */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">Test Credentials</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Email:</span>{' '}
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                  {testCredentials[selectedScenario][selectedCountry].email}
                </code>
              </div>
              <div>
                <span className="font-medium">Phone:</span>{' '}
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                  {testCredentials[selectedScenario][selectedCountry].phone}
                </code>
              </div>
              <div>
                <span className="font-medium">OTP:</span>{' '}
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">8888</code>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Testing Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Apply these credentials to your checkout form</li>
              <li>• Select Tabby as payment method</li>
              <li>• Complete the payment flow on Tabby's page</li>
              <li>• Use OTP: 8888 when prompted</li>
              <li>• Verify the expected behavior based on the scenario</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleApplyCredentials}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply Test Credentials
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbyTestingPanel;
