import { useAsset } from "../../hooks/useAsset";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import leadService from "../../services/leadService";
import { isValidEmail, isValidPhone } from "../../utils/validators";

const FloatingInput = ({ label, type = "text", name, value, onChange, error, required = false }) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        required={required}
        className={`peer w-full border-b bg-transparent pt-2 pb-4 text-lg md:text-xl focus:outline-none ltr:text-left rtl:text-right ${
          error ? 'border-red-500' : 'border-[#190143]'
        }`}
      />
      <label
        className={`absolute ltr:left-0 rtl:right-0 transition-all duration-200 ease-in-out
                   ${value ? 'top-[-0.75rem] text-xs' : 'top-2 text-lg md:text-xl'}
                   peer-focus:top-[-0.75rem] peer-focus:text-xs uppercase ${
          error ? 'text-red-500' : 'text-[#190143]'
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

const ContactUs = () => {
  const { t } = useTranslation("contact"); // load from contact namespace

  const contactText = useAsset("contact/contact-text.webp");
  const submitBtn = useAsset("contact/contact-button.webp");

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation (optional but validate if provided)
    if (formData.name && formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation (required)
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (required)
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Phone number is required';
    } else if (!isValidPhone(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid phone number';
    }

    // Message validation (optional)
    if (formData.message && formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      await leadService.submitLead(formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
        message: '',
      });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center md:py-20 py-12 bg-[#ebebeb]">
      {/* Title */}
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-xl md:text-3xl tracking-widest text-[#190143] mb-8">
          {t("title")}
        </h2>
        <img
          src={contactText}
          alt="Contact Us"
          className="mt-3 w-[300px] lg:w-[350px] h-auto w-auto object-contain"
        />
      </div>

      {/* Success Message */}
      {success && (
        <div className="w-full max-w-4xl px-6 sm:px-8 lg:px-0 mb-8">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="text-center">
              Thank you for your message! We'll get back to you soon.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="w-full max-w-4xl px-6 sm:px-8 lg:px-0 mb-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="text-center">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8 px-6 sm:px-8 lg:px-0">
        <FloatingInput 
          label={t("name")} 
          type="text" 
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
        />
        <FloatingInput 
          label={t("phone")} 
          type="tel" 
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleInputChange}
          error={errors.mobileNumber}
          required
        />
        <FloatingInput 
          label={t("email")} 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          required
        />
        <FloatingInput 
          label={t("message")} 
          type="text" 
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          error={errors.message}
        />

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="relative cursor-pointer transform transition-transform duration-500 hover:scale-105 md:mt-12 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src={submitBtn}
              alt="submit"
              className="w-[400px] lg:w-[450px] h-auto object-contain"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ContactUs;
