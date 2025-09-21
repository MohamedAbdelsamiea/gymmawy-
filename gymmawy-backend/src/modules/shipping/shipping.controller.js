import { 
  getShippingMethodsService, 
  createShippingMethodService, 
  updateShippingMethodService, 
  deleteShippingMethodService,
  trackShipmentService,
  generateShippingLabelService,
  getShippingInfoService
} from './shipping.service.js';

export const getShippingMethods = async (req, res) => {
  try {
    const methods = await getShippingMethodsService();
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createShippingMethod = async (req, res) => {
  try {
    const method = await createShippingMethodService(req.body);
    res.status(201).json(method);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const updateShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await updateShippingMethodService(id, req.body);
    res.json(method);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteShippingMethodService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const tracking = await trackShipmentService(trackingNumber);
    res.json({ tracking });
  } catch (error) {
    res.status(404).json({ error: { message: error.message } });
  }
};

export const generateShippingLabel = async (req, res) => {
  try {
    const { orderId, shippingMethodId } = req.body;
    const label = await generateShippingLabelService(orderId, shippingMethodId);
    res.json({ label });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getShippingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const info = await getShippingInfoService(orderId);
    res.json({ info });
  } catch (error) {
    res.status(404).json({ error: { message: error.message } });
  }
};
