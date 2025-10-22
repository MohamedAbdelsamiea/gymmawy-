import otoService from '../../services/otoService.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Helper function to find preferred shipping company in delivery options
 * @param {Array} deliveryOptions - Array of delivery options
 * @returns {Object|null} - Preferred shipping option or null
 */
export function findPreferredShipping(deliveryOptions) {
  if (!deliveryOptions || !Array.isArray(deliveryOptions)) {
    return null;
  }

  // Get preferred shipping company from environment variable
  const preferredCompany = process.env.PREFERRED_SHIPPING_COMPANY || 'aramex';
  const preferredKeywords = preferredCompany.toLowerCase().split(',').map(k => k.trim());
  
  return deliveryOptions.find(option => {
    const companyName = option.deliveryCompanyName?.toLowerCase() || '';
    return preferredKeywords.some(keyword => companyName.includes(keyword));
  });
}

/**
 * Create OTO order and shipment for a Gymmawy order
 */
export async function createOTOShipment(orderId) {
  try {
    // Get order details from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Check if order is paid or has enough credit status
    if (order.status !== 'PAID' && order.status !== 'NOT_ENOUGH_CREDIT') {
      throw new Error(`Order ${orderId} is not paid yet`);
    }

    // Check if shipment already exists
    if (order.otoShipmentId) {
      console.log(`Order ${orderId} already has OTO shipment: ${order.otoShipmentId}`);
      return {
        success: true,
        shipmentId: order.otoShipmentId,
        message: 'Shipment already exists'
      };
    }

    // Calculate shipping cost for this order
    const shippingCost = await calculateOrderShippingCost(orderId);
    if (!shippingCost.success) {
      throw new Error(`Failed to calculate shipping cost for order ${orderId}`);
    }

    // Check OTO wallet balance
    const walletBalance = await otoService.getWalletBalance();
    if (!walletBalance.success) {
      throw new Error('Failed to check OTO wallet balance');
    }

    const requiredAmount = shippingCost.shippingCost;
    const currentBalance = walletBalance.balance;

    console.log(`Credit check for order ${orderId}: Required ${requiredAmount} SAR, Available ${currentBalance} SAR`);

    // If not enough credit, set order status to NOT_ENOUGH_CREDIT
    if (currentBalance < requiredAmount) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'NOT_ENOUGH_CREDIT',
          metadata: {
            ...order.metadata,
            otoCreditRequired: requiredAmount,
            otoCurrentBalance: currentBalance,
            otoCreditShortfall: requiredAmount - currentBalance,
            lastCreditCheck: new Date().toISOString()
          }
        }
      });

      console.log(`❌ Not enough OTO credit for order ${orderId}. Required: ${requiredAmount} SAR, Available: ${currentBalance} SAR`);
      
      return {
        success: false,
        reason: 'NOT_ENOUGH_CREDIT',
        requiredAmount,
        currentBalance,
        shortfall: requiredAmount - currentBalance,
        message: `Not enough OTO credit. Required: ${requiredAmount} SAR, Available: ${currentBalance} SAR`
      };
    }

    // Prepare OTO order data
    const otoOrderData = {
      orderId: order.orderNumber, // Use Gymmawy order number as OTO orderId
      ref1: order.id, // Use Gymmawy order ID as reference
      pickupLocationCode: "My Pickup Location", // Fixed pickup location
      storeName: "Gymmawy",
      payment_method: order.isCashOnDelivery ? "cod" : "paid",
      amount: parseFloat(order.price || 0),
      amount_due: order.isCashOnDelivery ? parseFloat(order.price || 0) : 0,
      shippingAmount: parseFloat(order.shippingCost || 0),
      subtotal: parseFloat(order.price || 0) - parseFloat(order.shippingCost || 0),
      currency: order.currency,
      shippingNotes: "Please handle with care",
      packageSize: "small", // Default package size
      packageCount: 1,
      packageWeight: 1, // Default weight in kg
      boxWidth: 10,
      boxLength: 10,
      boxHeight: 10,
      orderDate: order.createdAt.toISOString(),
      customer: {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        email: order.user.email,
        mobile: order.user.mobileNumber,
        address: [
          order.shippingBuilding,
          order.shippingStreet,
          order.shippingCity,
          order.shippingCountry,
          order.shippingPostcode
        ].filter(Boolean).join(', '),
        city: order.shippingCity || 'Riyadh',
        country: order.shippingCountry || 'SA',
        postcode: order.shippingPostcode || '12345'
      },
      items: order.items.map(item => ({
        name: item.name || item.product?.name || 'Product',
        price: parseFloat(item.price || 0),
        quantity: item.quantity,
        sku: item.product?.id || `item-${item.id}`,
        image: item.product?.images?.[0]?.url || ''
      }))
    };

    // Create order and shipment in OTO
    const result = await otoService.createGymmawyOrder(otoOrderData);

    if (!result.success) {
      // If shipment creation fails, set status back to NOT_ENOUGH_CREDIT
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'NOT_ENOUGH_CREDIT',
          metadata: {
            ...order.metadata,
            otoShipmentError: result.data || 'Unknown error',
            lastShipmentAttempt: new Date().toISOString()
          }
        }
      });
      throw new Error('Failed to create OTO shipment');
    }

    // Update order with OTO shipment ID and set status to SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        otoShipmentId: result.shipment?.shipmentId || result.shipment?.id || 'pending',
        status: 'SHIPPED',
        metadata: {
          ...order.metadata,
          otoShipmentCreated: new Date().toISOString(),
          otoShipmentDetails: result.shipment
        }
      }
    });

    console.log(`✅ Created OTO shipment for order ${orderId}:`, result.shipment);

    return {
      success: true,
      shipmentId: result.shipment?.shipmentId || result.shipment?.id,
      order: result.order,
      shipment: result.shipment
    };

  } catch (error) {
    console.error(`❌ Failed to create OTO shipment for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get shipping cost for an order
 */
export async function calculateOrderShippingCost(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Calculate total weight from items
    const totalWeight = order.items.reduce((sum, item) => {
      const itemWeight = item.product?.weight || 0.5; // Default 0.5kg per item
      return sum + (itemWeight * item.quantity);
    }, 0);

    // Use OTO to calculate shipping cost
    const shippingData = {
      originCity: 'Riyadh', // Fixed origin
      destinationCity: order.shippingCity || 'Riyadh',
      weight: Math.max(totalWeight, 0.5), // Minimum 0.5kg
      totalDue: order.isCashOnDelivery ? parseFloat(order.price || 0) : 0,
      height: 10,
      width: 10,
      length: 10
    };

    const result = await otoService.calculateShippingCost(shippingData);

    if (!result.success) {
      throw new Error('Failed to calculate shipping cost');
    }

    const deliveryOptions = result.data.deliveryCompany || [];
    
    // Always prefer configured shipping company if available
    let selectedOption = findPreferredShipping(deliveryOptions);
    
    // If preferred company not found, fall back to cheapest option
    if (!selectedOption) {
      selectedOption = deliveryOptions[0];
    }

    if (!selectedOption) {
      throw new Error('No shipping options available');
    }

    return {
      success: true,
      shippingCost: selectedOption.price,
      currency: selectedOption.currency || 'SAR',
      deliveryTime: selectedOption.avgDeliveryTime,
      deliveryCompany: selectedOption.deliveryCompanyName,
      deliveryOptionId: selectedOption.deliveryOptionId
    };

  } catch (error) {
    console.error(`Failed to calculate shipping cost for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Validate a city name against OTO's available cities
 */
export async function validateCity(cityName) {
  try {
    // Get available cities from OTO
    const availableCitiesResult = await otoService.getAvailableCities({ limit: 1000 });
    
    if (!availableCitiesResult.success) {
      return {
        isValid: false,
        city: cityName,
        message: 'Failed to fetch available cities from OTO',
        suggestions: []
      };
    }

    const availableCities = availableCitiesResult.data?.cities || [];
    
    // Normalize city names for comparison
    const normalizeCity = (city) => {
      return city.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')    // Normalize spaces
        .trim();
    };

    const normalizedInput = normalizeCity(cityName);
    
    // Find exact match
    const exactMatch = availableCities.find(c => 
      normalizeCity(c.name || c) === normalizedInput
    );

    if (exactMatch) {
      return {
        isValid: true,
        city: exactMatch.name || exactMatch,
        message: 'City is valid',
        suggestions: []
      };
    }

    // Find partial matches (fuzzy search)
    const suggestions = availableCities
      .filter(c => {
        const normalizedCity = normalizeCity(c.name || c);
        return normalizedCity.includes(normalizedInput) || 
               normalizedInput.includes(normalizedCity) ||
               normalizedCity.startsWith(normalizedInput);
      })
      .slice(0, 5) // Limit to 5 suggestions
      .map(c => c.name || c);

    return {
      isValid: false,
      city: cityName,
      message: suggestions.length > 0 
        ? `City "${cityName}" not found. Did you mean one of these?`
        : `City "${cityName}" is not available for shipping. Please check available cities.`,
      suggestions: suggestions
    };

  } catch (error) {
    console.error('City validation error:', error);
    return {
      isValid: false,
      city: cityName,
      message: 'Failed to validate city',
      suggestions: []
    };
  }
}
