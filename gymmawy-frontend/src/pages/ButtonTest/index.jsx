import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JoinUsButton from '../../components/common/JoinUsButton';
import JoinUsButtonNew from '../../components/common/JoinUsButtonNew';

const ButtonTestPage = () => {
  const { t } = useTranslation('home');
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(null);

  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
    setLastClickTime(new Date().toLocaleTimeString());
  };

  const handleCustomClick = () => {
    alert('Custom click handler triggered!');
    handleButtonClick();
  };

  const handleLoadingClick = async () => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    handleButtonClick();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Join Us Button Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Test different variations and behaviors of the Join Us button
          </p>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Clicks:</p>
              <p className="text-2xl font-bold text-blue-600">{clickCount}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Last Click Time:</p>
              <p className="text-lg font-semibold text-green-600">
                {lastClickTime || 'No clicks yet'}
              </p>
            </div>
          </div>
        </div>

        {/* New Button Component Tests */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            New Join Us Button Component
          </h2>
          
          {/* Variants */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Default (Image)</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Original image-based button with improved animations.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew variant="image" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gradient Button</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Modern gradient button with hover effects.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew variant="default" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Outline Button</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Clean outline style button.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew variant="outline" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Text Button</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Minimal text-only button.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew variant="text" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Razor Button</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Custom razor-look button with gradient #291259 to #4e0a78 and 3 arrows.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew variant="razor" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Loading State</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Button with loading spinner.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew loading={true} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Disabled State</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Disabled button state.
              </p>
              <div className="flex justify-center">
                <JoinUsButtonNew disabled={true} />
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Different Sizes</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <JoinUsButtonNew size="small" />
              <JoinUsButtonNew size="medium" />
              <JoinUsButtonNew size="large" />
            </div>
          </div>

          {/* Animations */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Animation Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <JoinUsButtonNew animationType="scale" className="mb-2" />
                <p className="text-sm text-gray-600">Scale</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew animationType="bounce" className="mb-2" />
                <p className="text-sm text-gray-600">Bounce</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew animationType="glow" className="mb-2" />
                <p className="text-sm text-gray-600">Glow</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew animationType="none" className="mb-2" />
                <p className="text-sm text-gray-600">None</p>
              </div>
            </div>
          </div>

          {/* Razor Button Showcase */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Razor Button Showcase</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <JoinUsButtonNew variant="razor" animationType="scale" className="mb-2" />
                <p className="text-sm text-gray-600">Scale Animation</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew variant="razor" animationType="bounce" className="mb-2" />
                <p className="text-sm text-gray-600">Bounce Animation</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew variant="razor" animationType="glow" className="mb-2" />
                <p className="text-sm text-gray-600">Glow Animation</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew variant="razor" animationType="none" className="mb-2" />
                <p className="text-sm text-gray-600">No Animation</p>
              </div>
            </div>
          </div>

          {/* Interactive Tests */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Interactive Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <JoinUsButtonNew variant="razor" onClick={handleCustomClick} className="mb-2" />
                <p className="text-sm text-gray-600">Razor with Custom Click</p>
              </div>
              <div className="text-center">
                <JoinUsButtonNew variant="razor" onClick={handleLoadingClick} className="mb-2" />
                <p className="text-sm text-gray-600">Razor with Loading</p>
              </div>
            </div>
          </div>
        </div>

        {/* Original Button Tests */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Original Join Us Button
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Default Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Default Button</h3>
            <p className="text-gray-600 mb-4">
              This is the current Join Us button with default behavior (scrolls to packages section).
            </p>
            <div className="flex justify-center">
              <JoinUsButton />
            </div>
          </div>

          {/* Custom Click Handler */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Custom Click Handler</h3>
            <p className="text-gray-600 mb-4">
              This button has a custom click handler that shows an alert.
            </p>
            <div className="flex justify-center">
              <JoinUsButton onClick={handleCustomClick} />
            </div>
          </div>

          {/* Button with Custom Styling */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Custom Styling</h3>
            <p className="text-gray-600 mb-4">
              This button has custom CSS classes applied.
            </p>
            <div className="flex justify-center">
              <JoinUsButton className="opacity-80 hover:opacity-100" />
            </div>
          </div>

          {/* Button in Different Context */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Different Background</h3>
            <p className="text-gray-600 mb-4">
              Testing button appearance on different background colors.
            </p>
            <div className="bg-blue-900 p-6 rounded-lg">
              <div className="flex justify-center">
                <JoinUsButton />
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Testing Instructions</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• Click each button to test different behaviors</li>
            <li>• The default button should scroll to the packages section</li>
            <li>• The custom handler button should show an alert</li>
            <li>• Check how the button looks on different backgrounds</li>
            <li>• Test hover effects and transitions</li>
            <li>• Verify the button works on mobile devices</li>
          </ul>
        </div>

        {/* Packages Section for Scroll Testing */}
        <div id="packages" className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Packages Section (Scroll Target)
          </h2>
          <p className="text-lg text-gray-600 text-center">
            This section is here to test the scroll functionality of the default Join Us button.
            When you click the default button, it should smoothly scroll to this section.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ButtonTestPage;
