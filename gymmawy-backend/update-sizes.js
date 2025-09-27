import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSizes() {
  try {
    console.log('Updating order items with NULL size...');
    
    const result = await prisma.orderItem.updateMany({
      where: {
        size: null
      },
      data: {
        size: 'M'
      }
    });
    
    console.log(`Updated ${result.count} order items with size "M"`);
    
    // Verify the update
    const updatedItems = await prisma.orderItem.findMany({
      where: {
        size: 'M'
      },
      select: {
        id: true,
        quantity: true,
        size: true
      },
      take: 3
    });
    
    console.log('Sample updated items:', updatedItems);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSizes();
