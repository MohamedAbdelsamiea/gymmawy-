// Test script to verify currency translations are working
import i18n from './src/i18n/i18n.js';

// Wait for i18n to initialize
setTimeout(() => {
  console.log('🧪 Testing Currency Translations');
  console.log('================================');
  
  // Test English
  i18n.changeLanguage('en').then(() => {
    console.log('\n📝 English Translations:');
    console.log('detectedTitle:', i18n.t('currency.detectedTitle'));
    console.log('detectedMessage:', i18n.t('currency.detectedMessage', { 
      country: 'Egypt', 
      code: 'EGP' 
    }));
    console.log('keep:', i18n.t('currency.keep'));
    console.log('change:', i18n.t('currency.change'));
  });
  
  // Test Arabic
  setTimeout(() => {
    i18n.changeLanguage('ar').then(() => {
      console.log('\n📝 Arabic Translations:');
      console.log('detectedTitle:', i18n.t('currency.detectedTitle'));
      console.log('detectedMessage:', i18n.t('currency.detectedMessage', { 
        country: 'مصر', 
        code: 'EGP' 
      }));
      console.log('keep:', i18n.t('currency.keep'));
      console.log('change:', i18n.t('currency.change'));
    });
  }, 1000);
  
}, 2000);
