import { 
  listProgrammes, 
  getProgrammes,
  getProgrammeById, 
  createProgramme, 
  updateProgramme, 
  deleteProgramme,
  purchaseProgrammeWithPayment,
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
    const { skip, take, q, sortBy, sortOrder, currency } = req.query;
    const result = await listProgrammes({ 
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      q,
      sortBy,
      sortOrder,
      currency: currency || req.currency
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
