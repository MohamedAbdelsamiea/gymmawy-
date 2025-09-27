/**
 * Tabby Testing Configuration
 * Following official Tabby testing guidelines exactly
 */

export const TABBY_TEST_CREDENTIALS = {
  // Payment Success Flow
  SUCCESS: {
    UAE: {
      email: 'otp.success@tabby.ai',
      phone: '+971500000001'
    },
    KSA: {
      email: 'otp.success@tabby.ai', 
      phone: '+966500000001'
    },
    KUWAIT: {
      email: 'otp.success@tabby.ai',
      phone: '+96590000001'
    }
  },

  // Background Pre-scoring Reject Flow
  REJECT: {
    UAE: {
      email: 'otp.success@tabby.ai',
      phone: '+971500000002'
    },
    KSA: {
      email: 'otp.success@tabby.ai',
      phone: '+966500000002'
    },
    KUWAIT: {
      email: 'otp.success@tabby.ai',
      phone: '+96590000002'
    }
  },

  // Payment Failure Flow
  FAILURE: {
    UAE: {
      email: 'otp.rejected@tabby.ai',
      phone: '+971500000001'
    },
    KSA: {
      email: 'otp.rejected@tabby.ai',
      phone: '+966500000001'
    },
    KUWAIT: {
      email: 'otp.rejected@tabby.ai',
      phone: '+96590000001'
    }
  },

  // Corner Case Flow (same as success but for browser tab closure testing)
  CORNER_CASE: {
    UAE: {
      email: 'otp.success@tabby.ai',
      phone: '+971500000001'
    },
    KSA: {
      email: 'otp.success@tabby.ai',
      phone: '+966500000001'
    },
    KUWAIT: {
      email: 'otp.success@tabby.ai',
      phone: '+96590000001'
    }
  },

  // National ID Upload Scenario (Kuwait only)
  NATIONAL_ID_UPLOAD: {
    KUWAIT: {
      email: 'id.success@tabby.ai',
      phone: '+96590000001'
    }
  }
};

export const TABBY_TEST_MESSAGES = {
  REJECT: {
    EN: 'Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.',
    AR: 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
  },
  CANCEL: {
    EN: 'You aborted the payment. Please retry or choose another payment method.',
    AR: 'لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.'
  },
  FAILURE: {
    EN: 'Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.',
    AR: 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
  }
};

export const TABBY_TEST_SCENARIOS = {
  PAYMENT_SUCCESS: 'payment_success',
  BACKGROUND_REJECT: 'background_reject', 
  PAYMENT_CANCEL: 'payment_cancel',
  PAYMENT_FAILURE: 'payment_failure',
  CORNER_CASE: 'corner_case',
  NATIONAL_ID_UPLOAD: 'national_id_upload'
};

export const TABBY_OTP = '8888';
