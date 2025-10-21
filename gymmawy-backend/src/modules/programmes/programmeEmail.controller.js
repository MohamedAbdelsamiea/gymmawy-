import { sendProgrammeDeliveryEmail, sendBatchProgrammeDeliveryEmails } from './programmeEmail.service.js';

/**
 * Send programme delivery email manually (for testing/admin use)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function sendProgrammeEmail(req, res, next) {
  try {
    const { programmePurchaseId } = req.params;
    
    if (!programmePurchaseId) {
      return res.status(400).json({
        success: false,
        message: 'Programme purchase ID is required'
      });
    }

    const result = await sendProgrammeDeliveryEmail(programmePurchaseId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Programme delivery email sent successfully',
        data: {
          recipient: result.recipient,
          programmeName: result.programmeName
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending programme email:', error);
    next(error);
  }
}

/**
 * Send programme delivery emails for multiple purchases (batch operation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function sendBatchProgrammeEmails(req, res, next) {
  try {
    const { programmePurchaseIds } = req.body;
    
    if (!programmePurchaseIds || !Array.isArray(programmePurchaseIds) || programmePurchaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Programme purchase IDs array is required'
      });
    }

    const result = await sendBatchProgrammeDeliveryEmails(programmePurchaseIds);
    
    res.json({
      success: result.success,
      message: `Batch email sending completed. ${result.successful}/${result.total} emails sent successfully.`,
      data: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        results: result.results,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error sending batch programme emails:', error);
    next(error);
  }
}

export default {
  sendProgrammeEmail,
  sendBatchProgrammeEmails
};
