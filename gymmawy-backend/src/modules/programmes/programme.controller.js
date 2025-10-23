import { 
  listProgrammes, 
  getProgrammes,
  getProgrammeById, 
  createProgramme, 
  updateProgramme, 
  deleteProgramme,
  purchaseProgrammeWithPayment,
  purchaseFreeProgramme,
  getUserProgrammes,
  getProgrammeStats,
  approveProgrammePurchase,
  rejectProgrammePurchase,
  getPendingProgrammePurchases
} from './programme.service.js';

export const getProgrammesController = async (req, res) => {
  try {
    const programmes = await getProgrammes(req.query);
    res.json(programmes);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const listProgrammesController = async (req, res) => {
  try {
    const { skip, take, q, sortBy, sortOrder, currency, hasLoyaltyPoints } = req.query;
    const result = await listProgrammes({ 
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      q,
      sortBy,
      sortOrder,
      currency: currency || req.currency,
      hasLoyaltyPoints
    });
    res.json({
      ...result,
      currency: currency || req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getProgrammeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const programme = await getProgrammeById(id);
    res.json(programme);
  } catch (error) {
    res.status(404).json({ error: { message: error.message } });
  }
};

export const createProgrammeController = async (req, res) => {
  try {
    const programme = await createProgramme(req.body);
    res.status(201).json(programme);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const updateProgrammeController = async (req, res) => {
  try {
    const { id } = req.params;
    const programme = await updateProgramme(id, req.body);
    res.json(programme);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteProgrammeController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProgramme(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const purchaseProgrammeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, paymentData } = req.body;
    const result = await purchaseProgrammeWithPayment(userId, id, paymentData);
    res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: { message: error.message } });
  }
};

export const purchaseProgrammeWithPaymentController = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    const result = await purchaseProgrammeWithPayment(req.user.id, id, paymentData);
    res.status(201).json({ purchase: result });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: { message: error.message } });
  }
};

export const purchaseFreeProgrammeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { currency } = req.body;
    const lang = req.query.lang || req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
    
    // Get programme details first
    const programme = await getProgrammeById(id);
    if (!programme) {
      const errorMessage = lang === 'ar' 
        ? "البرنامج غير موجود" 
        : "Programme not found";
      return res.status(404).json({ error: { message: errorMessage } });
    }
    
    const result = await purchaseFreeProgramme(req.user.id, id, currency || 'EGP', programme);
    
    const successMessage = lang === 'ar'
      ? "تم شراء البرنامج المجاني بنجاح! تحقق من بريدك الإلكتروني للحصول على البرنامج."
      : "Free programme purchased successfully! Check your email for the programme.";
    
    res.status(201).json({ 
      purchase: result,
      message: successMessage
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: { message: error.message } });
  }
};

export const getUserProgrammesController = async (req, res) => {
  try {
    const programmes = await getUserProgrammes(req.user.id);
    res.json(programmes);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getProgrammeStatsController = async (req, res) => {
  try {
    const stats = await getProgrammeStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// Admin functions
export const getPendingProgrammePurchasesController = async (req, res) => {
  try {
    const purchases = await getPendingProgrammePurchases();
    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const approveProgrammePurchaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await approveProgrammePurchase(id);
    res.json({ purchase });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: { message: error.message } });
  }
};

export const rejectProgrammePurchaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const purchase = await rejectProgrammePurchase(id, reason);
    res.json({ purchase });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: { message: error.message } });
  }
};
