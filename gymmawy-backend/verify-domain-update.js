#!/usr/bin/env node

/**
 * Verification script to check for any remaining old domain references
 * This script will scan all tables and fields for any remaining instances of the old domain
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_DOMAIN = 'https://gym.omarelnemr.xyz';

async function verifyDomainUpdate() {
  try {
    console.log('🔍 Verifying domain update - checking for remaining old domain references...');
    console.log(`📝 Looking for: ${OLD_DOMAIN}`);
    console.log('');

    let foundAny = false;

    // Check all string fields that might contain URLs
    const tablesToCheck = [
      { table: 'HomepagePopup', fields: ['imageUrl'] },
      { table: 'ProductImage', fields: ['url'] },
      { table: 'SubscriptionPlan', fields: ['imageUrl'] },
      { table: 'Programme', fields: ['imageUrl', 'pdfUrl'] },
      { table: 'Video', fields: ['videoUrl', 'thumbnailEn', 'thumbnailAr'] },
      { table: 'Transformation', fields: ['imageUrl'] },
      { table: 'Payment', fields: ['paymentProofUrl'] }
    ];

    for (const { table, fields } of tablesToCheck) {
      console.log(`🔍 Checking ${table}...`);
      
      for (const field of fields) {
        const result = await prisma.$queryRaw`
          SELECT id, ${field} as field_value
          FROM "${table}"
          WHERE ${field} LIKE ${'%' + OLD_DOMAIN + '%'}
        `;
        
        if (result.length > 0) {
          console.log(`❌ Found ${result.length} records in ${table}.${field} with old domain:`);
          result.forEach(record => {
            console.log(`   - ID: ${record.id}, Value: ${record.field_value}`);
          });
          foundAny = true;
        } else {
          console.log(`✅ ${table}.${field} - No old domain references found`);
        }
      }
    }

    // Check JSON fields
    console.log('🔍 Checking JSON fields...');
    
    const jsonFieldsToCheck = [
      { table: 'SubscriptionPlan', fields: ['name', 'description'] },
      { table: 'Programme', fields: ['name'] },
      { table: 'Video', fields: ['title'] },
      { table: 'Transformation', fields: ['title'] },
      { table: 'HomepagePopup', fields: ['header', 'subheader', 'buttonText'] },
      { table: 'Payment', fields: ['metadata'] },
      { table: 'Order', fields: ['metadata'] }
    ];

    for (const { table, fields } of jsonFieldsToCheck) {
      console.log(`🔍 Checking ${table} JSON fields...`);
      
      for (const field of fields) {
        const result = await prisma.$queryRaw`
          SELECT id, ${field} as field_value
          FROM "${table}"
          WHERE ${field}::text LIKE ${'%' + OLD_DOMAIN + '%'}
        `;
        
        if (result.length > 0) {
          console.log(`❌ Found ${result.length} records in ${table}.${field} with old domain:`);
          result.forEach(record => {
            console.log(`   - ID: ${record.id}, Value: ${JSON.stringify(record.field_value)}`);
          });
          foundAny = true;
        } else {
          console.log(`✅ ${table}.${field} - No old domain references found`);
        }
      }
    }

    console.log('');
    if (foundAny) {
      console.log('❌ Verification failed - Found remaining old domain references');
      console.log('💡 Run the update-all-domains.js script again to fix these');
    } else {
      console.log('✅ Verification passed - No old domain references found');
      console.log('🎉 All domain references have been successfully updated!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyDomainUpdate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
