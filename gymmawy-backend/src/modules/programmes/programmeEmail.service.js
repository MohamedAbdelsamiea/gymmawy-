import { getPrismaClient } from '../../config/db.js';
import { sendEmail } from '../../utils/email.js';
import { getProgrammeDeliveryTemplate } from '../../utils/emailTemplates.js';
import { getFrontendUrl } from '../../utils/urls.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const prisma = getPrismaClient();

/**
 * Download PDF file from URL
 * @param {string} pdfUrl - The PDF URL to download
 * @param {string} filename - The filename to save as
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadPDF(pdfUrl, filename) {
  return new Promise((resolve, reject) => {
    const protocol = pdfUrl.startsWith('https:') ? https : http;
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);
    const file = fs.createWriteStream(filePath);
    
    protocol.get(pdfUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download PDF: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Clean up temporary files
 * @param {string} filePath - Path to file to delete
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn('Failed to cleanup temp file:', error.message);
  }
}

/**
 * Send programme delivery email when payment is approved
 * @param {string} programmePurchaseId - The programme purchase ID
 * @returns {Promise<Object>} Email sending result
 */
export async function sendProgrammeDeliveryEmail(programmePurchaseId) {
  try {
    console.log(`📧 Sending programme delivery email for purchase ${programmePurchaseId}`);

    // Get programme purchase with all related data
    const programmePurchase = await prisma.programmePurchase.findUnique({
      where: { id: programmePurchaseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            language: true
          }
        },
        programme: {
          select: {
            id: true,
            name: true,
            pdfUrl: true
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            createdAt: true
          }
        }
      }
    });

    if (!programmePurchase) {
      throw new Error(`Programme purchase not found: ${programmePurchaseId}`);
    }

    if (!programmePurchase.user) {
      throw new Error(`User not found for programme purchase: ${programmePurchaseId}`);
    }

    if (!programmePurchase.programme) {
      throw new Error(`Programme not found for purchase: ${programmePurchaseId}`);
    }

    if (!programmePurchase.payment) {
      throw new Error(`Payment not found for programme purchase: ${programmePurchaseId}`);
    }

    // Check if programme has PDF
    if (!programmePurchase.programme.pdfUrl) {
      console.warn(`⚠️ Programme ${programmePurchase.programme.id} has no PDF URL, skipping email`);
      return { success: false, message: 'Programme has no PDF file' };
    }

    // Format dates
    const purchaseDate = new Date(programmePurchase.payment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format payment amount
    const paymentAmount = parseFloat(programmePurchase.payment.amount).toFixed(2);

    // Get programme name (handle multilingual)
    let programmeName = 'Programme';
    if (programmePurchase.programme.name) {
      if (typeof programmePurchase.programme.name === 'object') {
        // Multilingual name object
        programmeName = programmePurchase.programme.name.en || 
                       programmePurchase.programme.name.ar || 
                       Object.values(programmePurchase.programme.name)[0];
      } else {
        // Simple string name
        programmeName = programmePurchase.programme.name;
      }
    }

    // Get frontend URL for template
    const frontendUrl = getFrontendUrl();

    // Prepare email data
    const emailData = {
      firstName: programmePurchase.user.firstName || 'User',
      email: programmePurchase.user.email,
      programmeName: programmeName,
      programmeUrl: programmePurchase.programme.pdfUrl, // Keep for template compatibility
      purchaseDate: purchaseDate,
      purchaseNumber: programmePurchase.purchaseNumber || programmePurchase.id,
      paymentAmount: paymentAmount,
      currency: programmePurchase.payment.currency,
      paymentMethod: programmePurchase.payment.method,
      frontendUrl: frontendUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@gymmawy.com'
    };

    // Determine user language
    const userLanguage = programmePurchase.user.language || 'en';

    // Download PDF file for attachment
    let pdfFilePath = null;
    let attachments = [];
    
    try {
      console.log(`📥 Downloading PDF file: ${programmePurchase.programme.pdfUrl}`);
      const filename = `${programmeName.replace(/[^a-zA-Z0-9]/g, '_')}_${programmePurchase.id}.pdf`;
      pdfFilePath = await downloadPDF(programmePurchase.programme.pdfUrl, filename);
      
      // Add PDF as attachment
      attachments.push({
        filename: filename,
        path: pdfFilePath,
        contentType: 'application/pdf'
      });
      
      console.log(`✅ PDF downloaded successfully: ${filename}`);
    } catch (downloadError) {
      console.error(`❌ Failed to download PDF: ${downloadError.message}`);
      // Continue without attachment - email will still be sent
    }

    // Generate email content
    const html = getProgrammeDeliveryTemplate(emailData, userLanguage);
    const text = `Hello ${emailData.firstName},\n\nYour programme "${programmeName}" is attached to this email!\n\nPurchase Details:\n- Purchase Number: ${emailData.purchaseNumber}\n- Amount: ${paymentAmount} ${emailData.currency}\n- Date: ${purchaseDate}\n\nYour programme PDF is attached to this email. Please save it to your device.\n\nThank you for choosing Gymmawy!`;

    // Send email with attachment
    const emailResult = await sendEmail({
      to: programmePurchase.user.email,
      subject: userLanguage === 'ar' 
        ? `برنامجك جاهز - ${programmeName}` 
        : `Your Programme is Ready - ${programmeName}`,
      html: html,
      text: text,
      attachments: attachments
    });

    console.log(`✅ Programme delivery email sent successfully to ${programmePurchase.user.email}`);
    
    // Clean up temporary PDF file
    if (pdfFilePath) {
      cleanupTempFile(pdfFilePath);
      console.log(`🗑️ Cleaned up temporary PDF file`);
    }
    
    // Log email sending in database (optional)
    try {
      await prisma.programmePurchase.update({
        where: { id: programmePurchaseId },
        data: {
          metadata: {
            ...programmePurchase.metadata,
            deliveryEmailSent: true,
            deliveryEmailSentAt: new Date().toISOString(),
            pdfAttached: attachments.length > 0
          }
        }
      });
    } catch (logError) {
      console.warn('Failed to log email sending in database:', logError.message);
    }

    return {
      success: true,
      message: 'Programme delivery email sent successfully',
      recipient: programmePurchase.user.email,
      programmeName: programmeName,
      pdfAttached: attachments.length > 0
    };

  } catch (error) {
    console.error('❌ Failed to send programme delivery email:', error);
    
    // Clean up temporary PDF file if it exists
    if (pdfFilePath) {
      cleanupTempFile(pdfFilePath);
    }
    
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

/**
 * Send programme delivery email for multiple purchases
 * @param {Array<string>} programmePurchaseIds - Array of programme purchase IDs
 * @returns {Promise<Object>} Batch sending result
 */
export async function sendBatchProgrammeDeliveryEmails(programmePurchaseIds) {
  const results = [];
  const errors = [];

  for (const purchaseId of programmePurchaseIds) {
    try {
      const result = await sendProgrammeDeliveryEmail(purchaseId);
      results.push({ purchaseId, ...result });
    } catch (error) {
      errors.push({ purchaseId, error: error.message });
    }
  }

  return {
    success: errors.length === 0,
    total: programmePurchaseIds.length,
    successful: results.filter(r => r.success).length,
    failed: errors.length,
    results,
    errors
  };
}

export default {
  sendProgrammeDeliveryEmail,
  sendBatchProgrammeDeliveryEmails
};
