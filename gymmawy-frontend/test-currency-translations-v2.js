// Test script to verify currency translations are working
import i18n from './src/i18n/i18n.js';

// Wait for i18n to initialize
setTimeout(async () => {
  console.log('🧪 Testing Currency Translations');
  console.log('================================');
  
  try {
    // Load the currency namespace explicitly
    await i18n.loadNamespaces('currency');
    console.log('✅ Currency namespace loaded');
    
    // Test English
    await i18n.changeLanguage('en');
    console.log('\n📝 English Translations:');
    console.log('detectedTitle:', i18n.t('currency.detectedTitle'));
    console.log('detectedMessage:', i18n.t('currency.detectedMessage', { 
      country: 'Egypt', 
      code: 'EGP' 
    }));
    console.log('keep:', i18n.t('currency.keep'));
    console.log('change:', i18n.t('currency.change'));
    
    // Test Arabic
    await i18n.changeLanguage('ar');
    console.log('\n📝 Arabic Translations:');
    console.log('detectedTitle:', i18n.t('currency.detectedTitle'));
    console.log('detectedMessage:', i18n.t('currency.detectedMessage', { 
      country: 'مصر', 
      code: 'EGP' 
    }));
    console.log('keep:', i18n.t('currency.keep'));
    console.log('change:', i18n.t('currency.change'));
    
    // Check if files exist
    console.log('\n📁 Checking translation files:');
    const fs = await import('fs');
    const path = await import('path');
    
    const enFile = path.join(process.cwd(), 'public/locales/en/currency.json');
    const arFile = path.join(process.cwd(), 'public/locales/ar/currency.json');
    
    console.log('EN file exists:', fs.existsSync(enFile));
    console.log('AR file exists:', fs.existsSync(arFile));
    
    if (fs.existsSync(enFile)) {
      const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
      console.log('EN content:', enContent);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
}, 3000);
