import { 
  getReferralsService, 
  createReferralService, 
  updateReferralService, 
  deleteReferralService,
  getMyReferralCodesService,
  validateReferralCodeService,
  deactivateReferralCodeService,
  getReferralAnalyticsService,
  getReferralRewardsService,
  generateReferralCodeService,
  useReferralCodeService
} from './referral.service.js';

export const getReferrals = async (req, res) => {
  try {
    const referrals = await getReferralsService();
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createReferral = async (req, res) => {
  try {
    const referral = await createReferralService(req.body);
    res.status(201).json(referral);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const updateReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const referral = await updateReferralService(id, req.body);
    res.json(referral);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteReferral = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteReferralService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getMyReferralCodes = async (req, res) => {
  try {
    const codes = await getMyReferralCodesService(req.user.id);
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;
    const referral = await validateReferralCodeService(code);
    res.json({ referral });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deactivateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;
    await deactivateReferralCodeService(req.user.id, code);
    res.json({ success: true, message: "Referral code deactivated" });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getReferralAnalytics = async (req, res) => {
  try {
    const analytics = await getReferralAnalyticsService(req.user.id);
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getReferralRewards = async (req, res) => {
  try {
    const rewards = await getReferralRewardsService(req.user.id);
    res.json({ rewards });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const generateReferralCode = async (req, res) => {
  try {
    const { userId } = req.body;
    const code = await generateReferralCodeService(userId || req.user.id);
    res.status(201).json({ code });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const useReferralCode = async (req, res) => {
  try {
    const { code, userId } = req.body;
    const result = await useReferralCodeService(code, userId || req.user.id);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};
