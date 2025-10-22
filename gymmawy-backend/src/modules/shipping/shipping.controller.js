import otoService from '../../services/otoService.js';
import { getPrismaClient } from '../../config/db.js';
import { findPreferredShipping } from './shipping.service.js';
import { z } from 'zod';

const prisma = getPrismaClient();

/**
 * Calculate shipping cost for checkout
 */
export async function calculateShippingCost(req, res, next) {
  try {
    const schema = z.object({
      originCity: z.string().min(1, 'Origin city is required'),
      destinationCity: z.string().min(1, 'Destination city is required'),
      weight: z.number().positive('Weight must be positive'),
      totalDue: z.number().optional().default(0), // For COD
      height: z.number().optional(),
      width: z.number().optional(),
      length: z.number().optional()
    });

    const shippingData = schema.parse(req.body);

    // Calculate shipping cost using OTO
    const result = await otoService.calculateShippingCost(shippingData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate shipping cost',
        error: result.data
      });
    }

    // Always prefer configured shipping company if available
    const deliveryOptions = result.data.deliveryCompany || [];
    let selectedOption = findPreferredShipping(deliveryOptions);
    
    // If preferred company not found, fall back to cheapest option
    if (!selectedOption) {
      selectedOption = deliveryOptions[0];
    }

    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'No shipping options available for this location'
      });
    }

    res.json({
      success: true,
      shippingCost: selectedOption.price,
      currency: selectedOption.currency || 'SAR',
      deliveryTime: selectedOption.avgDeliveryTime,
      deliveryCompany: selectedOption.deliveryCompanyName,
      options: deliveryOptions.map(option => ({
        price: option.price,
        currency: option.currency || 'SAR',
        deliveryTime: option.avgDeliveryTime,
        deliveryCompany: option.deliveryCompanyName,
        deliveryOptionId: option.deliveryOptionId,
        serviceType: option.serviceType
      }))
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
}

/**
 * Get available cities for shipping
 */
export async function getAvailableCities(req, res, next) {
  try {
    const result = await otoService.getAvailableCities();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get available cities',
        error: result.data
      });
    }

    res.json({
      success: true,
      cities: result.data.orders || []
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Get delivery options for a specific city
 */
export async function getDeliveryOptions(req, res, next) {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    const result = await otoService.getDeliveryOptions(city);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get delivery options',
        error: result.data
      });
    }

    res.json({
      success: true,
      options: result.data.options || []
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Test OTO connection
 */
export async function testOTOConnection(req, res, next) {
  try {
    // Test basic OTO API connection
    const result = await otoService.getAvailableCities({ limit: 1 });
    
    res.json({
      success: true,
      message: 'OTO connection successful',
      data: result.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTO connection failed',
      error: error.message
    });
  }
}

/**
 * Retry shipment creation for a specific order (Admin only)
 */
export async function retryShipmentCreation(req, res, next) {
  try {
    const { orderId } = req.params;
    
    const { createOTOShipment } = await import('./shipping.service.js');
    const result = await createOTOShipment(orderId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Shipment created successfully',
        shipmentId: result.shipmentId
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        reason: result.reason,
        requiredAmount: result.requiredAmount,
        currentBalance: result.currentBalance,
        shortfall: result.shortfall
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create shipment',
      error: error.message
    });
  }
}

/**
 * Get credit summary for failed shipments (Admin only)
 */
export async function getCreditSummary(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'NOT_ENOUGH_CREDIT' },
      select: {
        id: true,
        orderNumber: true,
        shippingCost: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const totalRequired = orders.reduce((sum, order) => {
      const required = order.metadata?.otoCreditRequired || order.shippingCost || 0;
      return sum + parseFloat(required);
    }, 0);

    const currentBalance = await otoService.getWalletBalance();
    const shortfall = Math.max(0, totalRequired - (currentBalance.balance || 0));

    res.json({
      success: true,
      summary: {
        totalOrders: orders.length,
        totalRequired: totalRequired,
        currentBalance: currentBalance.balance || 0,
        shortfall: shortfall,
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          requiredAmount: order.metadata?.otoCreditRequired || order.shippingCost || 0,
          customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
          customerEmail: order.user.email,
          createdAt: order.createdAt
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get credit summary',
      error: error.message
    });
  }
}

/**
 * Bulk retry shipment creation for all failed orders (Admin only)
 */
export async function bulkRetryShipments(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'NOT_ENOUGH_CREDIT' },
      select: { id: true, orderNumber: true }
    });

    const results = [];
    const { createOTOShipment } = await import('./shipping.service.js');

    for (const order of orders) {
      try {
        const result = await createOTOShipment(order.id);
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: result.success,
          shipmentId: result.shipmentId,
          message: result.message || 'Success'
        });
      } catch (error) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Processed ${results.length} orders. ${successCount} successful, ${failureCount} failed.`,
      results: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to bulk retry shipments',
      error: error.message
    });
  }
}

/**
 * Validate and suggest cities for OTO shipping
 */
export async function validateCity(req, res, next) {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    // Fallback cities list for Egypt
    const fallbackCities = [
      'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura',
      'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Faiyum', 'Zagazig', 'Aswan', 'Damietta',
      'Damanhur', 'Minya', 'Beni Suef', 'Hurghada', 'Qena', 'Sohag', '6th of October City', 'Shibin El Kom',
      'Banha', 'Kafr el-Sheikh', 'Mallawi', 'Bilbeis', 'Marsa Matruh', 'Kafr el-Dawwar', 'Qalyub', 'Desouk',
      'Abu Kabir', 'Girga', 'Akhmim', 'Matareya', 'Edko', 'Bani Mazar', 'Samalut', 'Manfalut',
      'Senbellawein', 'Tala', 'Ashmun', 'El Ghanayem', 'Sidi Salem', 'Sirs al-Layyan', 'Ibsheway', 'Abu Tig',
      'El Fashn', 'New Akhmim', 'New Nubariya', 'New Salhia', 'New Minya', 'New Assiut', 'New Sohag',
      'New Qena', 'New Luxor', 'New Aswan', 'New Hurghada', 'New Sharm El Sheikh', 'New Damanhur',
      'New Tanta', 'New Mansoura', 'New Zagazig', 'New Ismailia', 'New Port Said', 'New Suez'
    ];

    let availableCities = [];

    // Try to get cities from OTO service first
    try {
      const availableCitiesResult = await otoService.getAvailableCities({ limit: 1000 });
      
      if (availableCitiesResult.success && availableCitiesResult.data?.cities?.length > 0) {
        availableCities = availableCitiesResult.data.cities;
      } else {
        // Use fallback if OTO service fails or returns empty
        availableCities = fallbackCities.map(city => ({ name: city }));
      }
    } catch (otoError) {
      console.warn('OTO service failed, using fallback cities:', otoError.message);
      // Use fallback if OTO service throws error
      availableCities = fallbackCities.map(city => ({ name: city }));
    }
    
    // Normalize city names for comparison
    const normalizeCity = (cityName) => {
      return cityName.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')    // Normalize spaces
        .trim();
    };

    const normalizedInput = normalizeCity(city);
    
    // Find exact match
    const exactMatch = availableCities.find(c => 
      normalizeCity(c.name || c) === normalizedInput
    );

    if (exactMatch) {
      return res.json({
        success: true,
        isValid: true,
        city: exactMatch.name || exactMatch,
        suggestions: []
      });
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

    res.json({
      success: true,
      isValid: false,
      city: city,
      suggestions: suggestions,
      message: suggestions.length > 0 
        ? `City "${city}" not found. Did you mean one of these?`
        : `City "${city}" is not available for shipping. Please check available cities.`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate city',
      error: error.message
    });
  }
}

/**
 * Search cities with autocomplete
 */
export async function searchCities(req, res, next) {
  try {
    const { q, limit = 10 } = req.query;
    
    console.log('🔍 City search request:', { q, limit });
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        cities: []
      });
    }

    // Fallback cities list for Egypt
    const fallbackCities = [
      'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura',
      'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Faiyum', 'Zagazig', 'Aswan', 'Damietta',
      'Damanhur', 'Minya', 'Beni Suef', 'Hurghada', 'Qena', 'Sohag', '6th of October City', 'Shibin El Kom',
      'Banha', 'Kafr el-Sheikh', 'Mallawi', 'Bilbeis', 'Marsa Matruh', 'Kafr el-Dawwar', 'Qalyub', 'Desouk',
      'Abu Kabir', 'Girga', 'Akhmim', 'Matareya', 'Edko', 'Bani Mazar', 'Samalut', 'Manfalut',
      'Senbellawein', 'Tala', 'Ashmun', 'El Ghanayem', 'Sidi Salem', 'Sirs al-Layyan', 'Ibsheway', 'Abu Tig',
      'El Fashn', 'New Akhmim', 'New Nubariya', 'New Salhia', 'New Minya', 'New Assiut', 'New Sohag',
      'New Qena', 'New Luxor', 'New Aswan', 'New Hurghada', 'New Sharm El Sheikh', 'New Damanhur',
      'New Tanta', 'New Mansoura', 'New Zagazig', 'New Ismailia', 'New Port Said', 'New Suez'
    ];

    let availableCities = [];

    // Try to get cities from OTO service first
    try {
      const availableCitiesResult = await otoService.getAvailableCities({ limit: 1000 });
      
      if (availableCitiesResult.success && availableCitiesResult.data?.cities?.length > 0) {
        availableCities = availableCitiesResult.data.cities;
      } else {
        // Use fallback if OTO service fails or returns empty
        availableCities = fallbackCities.map(city => ({ name: city }));
      }
    } catch (otoError) {
      console.warn('OTO service failed, using fallback cities:', otoError.message);
      // Use fallback if OTO service throws error
      availableCities = fallbackCities.map(city => ({ name: city }));
    }
    
    // Filter cities based on search query
    const normalizedQuery = q.toLowerCase();
    const matchingCities = availableCities
      .filter(c => {
        const cityName = (c.name || c).toLowerCase();
        return cityName.includes(normalizedQuery);
      })
      .slice(0, parseInt(limit))
      .map(c => ({
        name: c.name || c,
        value: c.name || c
      }));

    console.log('🔍 City search results:', {
      query: q,
      availableCitiesCount: availableCities.length,
      matchingCitiesCount: matchingCities.length,
      matchingCities: matchingCities
    });

    res.json({
      success: true,
      cities: matchingCities
    });

  } catch (error) {
    console.error('City search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cities',
      error: error.message
    });
  }
}
