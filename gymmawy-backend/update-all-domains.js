#!/usr/bin/env node

/**
 * Comprehensive database migration script to update ALL old domain references
 * This script covers every table and field that might contain URL references
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_DOMAIN = 'https://gym.omarelnemr.xyz';
const NEW_DOMAIN = 'https://gymmawy.fit';

async function updateAllDomainReferences() {
  try {
    console.log('🔄 Starting comprehensive domain update migration...');
    console.log(`📝 Replacing: ${OLD_DOMAIN}`);
    console.log(`📝 With: ${NEW_DOMAIN}`);
    console.log('');

    let totalUpdated = 0;

    // 1. HomepagePopup table
    console.log('🏠 Updating HomepagePopup...');
    const popupResult = await prisma.$executeRaw`
      UPDATE "HomepagePopup" 
      SET "imageUrl" = REPLACE("imageUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "imageUrl" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${popupResult} popup records`);

    // 2. ProductImage table
    console.log('🖼️ Updating ProductImage...');
    const productImageResult = await prisma.$executeRaw`
      UPDATE "ProductImage" 
      SET "url" = REPLACE("url", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "url" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${productImageResult} product image records`);

    // 3. SubscriptionPlan table
    console.log('📋 Updating SubscriptionPlan...');
    const subscriptionResult = await prisma.$executeRaw`
      UPDATE "SubscriptionPlan" 
      SET "imageUrl" = REPLACE("imageUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "imageUrl" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${subscriptionResult} subscription plan records`);

    // 4. Programme table
    console.log('📚 Updating Programme...');
    const programmeResult = await prisma.$executeRaw`
      UPDATE "Programme" 
      SET "imageUrl" = REPLACE("imageUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN}),
          "pdfUrl" = REPLACE("pdfUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "imageUrl" LIKE ${'%' + OLD_DOMAIN + '%'} 
         OR "pdfUrl" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${programmeResult} programme records`);

    // 5. Video table
    console.log('🎥 Updating Video...');
    const videoResult = await prisma.$executeRaw`
      UPDATE "Video" 
      SET "videoUrl" = REPLACE("videoUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN}),
          "thumbnailEn" = REPLACE("thumbnailEn", ${OLD_DOMAIN}, ${NEW_DOMAIN}),
          "thumbnailAr" = REPLACE("thumbnailAr", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "videoUrl" LIKE ${'%' + OLD_DOMAIN + '%'} 
         OR "thumbnailEn" LIKE ${'%' + OLD_DOMAIN + '%'}
         OR "thumbnailAr" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${videoResult} video records`);

    // 6. Transformation table
    console.log('🔄 Updating Transformation...');
    const transformationResult = await prisma.$executeRaw`
      UPDATE "Transformation" 
      SET "imageUrl" = REPLACE("imageUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "imageUrl" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${transformationResult} transformation records`);

    // 7. Payment table - paymentProofUrl
    console.log('💳 Updating Payment...');
    const paymentResult = await prisma.$executeRaw`
      UPDATE "Payment" 
      SET "paymentProofUrl" = REPLACE("paymentProofUrl", ${OLD_DOMAIN}, ${NEW_DOMAIN})
      WHERE "paymentProofUrl" LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    console.log(`✅ Updated ${paymentResult} payment records`);

    // 8. Check for any JSON fields that might contain URLs
    console.log('🔍 Checking JSON fields for domain references...');
    
    // Check SubscriptionPlan name/description JSON fields
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
      where: {
        OR: [
          { name: { path: ['$'], string_contains: OLD_DOMAIN } },
          { description: { path: ['$'], string_contains: OLD_DOMAIN } }
        ]
      }
    });
    
    for (const plan of subscriptionPlans) {
      let updated = false;
      const name = plan.name;
      const description = plan.description;
      
      if (name && JSON.stringify(name).includes(OLD_DOMAIN)) {
        const updatedName = JSON.parse(JSON.stringify(name).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { name: updatedName }
        });
        updated = true;
      }
      
      if (description && JSON.stringify(description).includes(OLD_DOMAIN)) {
        const updatedDescription = JSON.parse(JSON.stringify(description).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { description: updatedDescription }
        });
        updated = true;
      }
      
      if (updated) {
        console.log(`✅ Updated JSON fields in subscription plan: ${plan.id}`);
      }
    }

    // Check Programme name JSON fields
    const programmes = await prisma.programme.findMany({
      where: {
        name: { path: ['$'], string_contains: OLD_DOMAIN }
      }
    });
    
    for (const programme of programmes) {
      const name = programme.name;
      if (name && JSON.stringify(name).includes(OLD_DOMAIN)) {
        const updatedName = JSON.parse(JSON.stringify(name).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.programme.update({
          where: { id: programme.id },
          data: { name: updatedName }
        });
        console.log(`✅ Updated JSON fields in programme: ${programme.id}`);
      }
    }

    // Check Video title JSON fields
    const videos = await prisma.video.findMany({
      where: {
        title: { path: ['$'], string_contains: OLD_DOMAIN }
      }
    });
    
    for (const video of videos) {
      const title = video.title;
      if (title && JSON.stringify(title).includes(OLD_DOMAIN)) {
        const updatedTitle = JSON.parse(JSON.stringify(title).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.video.update({
          where: { id: video.id },
          data: { title: updatedTitle }
        });
        console.log(`✅ Updated JSON fields in video: ${video.id}`);
      }
    }

    // Check Transformation title JSON fields
    const transformations = await prisma.transformation.findMany({
      where: {
        title: { path: ['$'], string_contains: OLD_DOMAIN }
      }
    });
    
    for (const transformation of transformations) {
      const title = transformation.title;
      if (title && JSON.stringify(title).includes(OLD_DOMAIN)) {
        const updatedTitle = JSON.parse(JSON.stringify(title).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.transformation.update({
          where: { id: transformation.id },
          data: { title: updatedTitle }
        });
        console.log(`✅ Updated JSON fields in transformation: ${transformation.id}`);
      }
    }

    // Check HomepagePopup JSON fields
    const popups = await prisma.homepagePopup.findMany({
      where: {
        OR: [
          { header: { path: ['$'], string_contains: OLD_DOMAIN } },
          { subheader: { path: ['$'], string_contains: OLD_DOMAIN } },
          { buttonText: { path: ['$'], string_contains: OLD_DOMAIN } }
        ]
      }
    });
    
    for (const popup of popups) {
      let updated = false;
      const header = popup.header;
      const subheader = popup.subheader;
      const buttonText = popup.buttonText;
      
      if (header && JSON.stringify(header).includes(OLD_DOMAIN)) {
        const updatedHeader = JSON.parse(JSON.stringify(header).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.homepagePopup.update({
          where: { id: popup.id },
          data: { header: updatedHeader }
        });
        updated = true;
      }
      
      if (subheader && JSON.stringify(subheader).includes(OLD_DOMAIN)) {
        const updatedSubheader = JSON.parse(JSON.stringify(subheader).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.homepagePopup.update({
          where: { id: popup.id },
          data: { subheader: updatedSubheader }
        });
        updated = true;
      }
      
      if (buttonText && JSON.stringify(buttonText).includes(OLD_DOMAIN)) {
        const updatedButtonText = JSON.parse(JSON.stringify(buttonText).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.homepagePopup.update({
          where: { id: popup.id },
          data: { buttonText: updatedButtonText }
        });
        updated = true;
      }
      
      if (updated) {
        console.log(`✅ Updated JSON fields in popup: ${popup.id}`);
      }
    }

    // 9. Check for any other potential URL fields in metadata or other JSON fields
    console.log('🔍 Checking metadata and other JSON fields...');
    
    // Check Payment metadata
    const paymentsWithMetadata = await prisma.payment.findMany({
      where: {
        metadata: { path: ['$'], string_contains: OLD_DOMAIN }
      }
    });
    
    for (const payment of paymentsWithMetadata) {
      const metadata = payment.metadata;
      if (metadata && JSON.stringify(metadata).includes(OLD_DOMAIN)) {
        const updatedMetadata = JSON.parse(JSON.stringify(metadata).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.payment.update({
          where: { id: payment.id },
          data: { metadata: updatedMetadata }
        });
        console.log(`✅ Updated metadata in payment: ${payment.id}`);
      }
    }

    // Check Order metadata
    const ordersWithMetadata = await prisma.order.findMany({
      where: {
        metadata: { path: ['$'], string_contains: OLD_DOMAIN }
      }
    });
    
    for (const order of ordersWithMetadata) {
      const metadata = order.metadata;
      if (metadata && JSON.stringify(metadata).includes(OLD_DOMAIN)) {
        const updatedMetadata = JSON.parse(JSON.stringify(metadata).replace(new RegExp(OLD_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DOMAIN));
        await prisma.order.update({
          where: { id: order.id },
          data: { metadata: updatedMetadata }
        });
        console.log(`✅ Updated metadata in order: ${order.id}`);
      }
    }

    console.log('');
    console.log('🎉 Comprehensive domain update migration completed successfully!');
    console.log(`📊 Total records updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error('❌ Error during domain update migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
updateAllDomainReferences()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
