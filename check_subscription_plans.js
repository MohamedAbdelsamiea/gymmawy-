const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscriptionPlans() {
  try {
    console.log('Checking subscription plans...');
    
    const plans = await prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPeriodDays: true,
        giftPeriodDays: true,
        priceEGP: true,
        priceSAR: true
      }
    });
    
    console.log('Found plans:', plans.length);
    plans.forEach((plan, index) => {
      console.log(`\nPlan ${index + 1}:`);
      console.log('  ID:', plan.id);
      console.log('  Name:', plan.name);
      console.log('  Subscription Period Days:', plan.subscriptionPeriodDays);
      console.log('  Gift Period Days:', plan.giftPeriodDays);
      console.log('  Price EGP:', plan.priceEGP);
      console.log('  Price SAR:', plan.priceSAR);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptionPlans();
