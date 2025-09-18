import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Search, Edit, Calculator, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import adminApiService from '../../services/adminApiService';
import AdminImageUpload from '../common/AdminImageUpload';
import { useToast } from '../../contexts/ToastContext';

// Sortable Benefit Component
const SortableBenefit = ({ benefit, children, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: benefit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const benefitId = benefit?.id || benefit?.benefit?.id;

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 px-3 py-2 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-2"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {children}
        </div>
        <div className="flex gap-2 ml-2">
          <button
            type="button"
            onClick={() => onEdit(benefit, 'plan-only')}
            className="text-blue-600 hover:text-blue-800"
            title="Create a new benefit for this plan only - Other plans will keep the original benefit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(benefitId, 'plan-only')}
            className="text-red-600 hover:text-red-800"
            title="Remove this benefit - This will only remove it from this plan, other plans will keep it"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess, editData = null, isEdit = false }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    imageUrl: '',
    discountPercentage: 0,
    subscriptionPeriodDays: 30,
    giftPeriodDays: 0,
    loyaltyPointsAwarded: '',
    loyaltyPointsRequired: '',
    medicalLoyaltyPointsAwarded: '',
    medicalLoyaltyPointsRequired: '',
    crown: { en: '', ar: '' },
  });
  
  // Pricing data for all currencies
  const [pricing, setPricing] = useState({
    subscription: {
      EGP: '',
      SAR: '',
      AED: '',
      USD: ''
    },
    medical: {
      EGP: '',
      SAR: '',
      AED: '',
      USD: ''
    }
  });
  const [periodType, setPeriodType] = useState('days');
  const [giftPeriodType, setGiftPeriodType] = useState('days');
  const [periodValue, setPeriodValue] = useState('30');
  const [giftPeriodValue, setGiftPeriodValue] = useState('0');
  const [benefits, setBenefits] = useState([]);
  const [availableBenefits, setAvailableBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState({ en: '', ar: '' });
  const [showNewBenefit, setShowNewBenefit] = useState(false);
  const [benefitSearch, setBenefitSearch] = useState('');
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [editBenefit, setEditBenefit] = useState({ en: '', ar: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [editingBenefitScope, setEditingBenefitScope] = useState(null); // 'plan-only' or 'global'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enableLoyaltyPoints, setEnableLoyaltyPoints] = useState(false);
  const [enableCrown, setEnableCrown] = useState(false);
  const [crownColor, setCrownColor] = useState('#3F0071'); // Default purple color
  const [errorField, setErrorField] = useState(null);
  const [benefitsInitialized, setBenefitsInitialized] = useState(false);
  const [medicalFactor, setMedicalFactor] = useState('50'); // Default 50% factor

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Function to safely set benefits - prevents clearing if benefits are already set
  const setBenefitsSafely = (newBenefits) => {
    // Debug logs removed for production
    
    // If benefits are already initialized and we have existing benefits, don't clear them
    if (benefitsInitialized && benefits.length > 0 && (!newBenefits || newBenefits.length === 0)) {
      // Debug logs removed for production
      return;
    }
    
    setBenefits(newBenefits || []);
  };

  // Effect to initialize form data when modal opens
  useEffect(() => {
    // Debug logs removed for production
    if (isOpen) {
      // Reset benefits initialization flag when modal opens
      setBenefitsInitialized(false);
      if (isEdit && editData) {
        // Populate form with edit data
        setFormData({
          name: { en: editData.name?.en ?? '', ar: editData.name?.ar ?? '' },
          description: { en: editData.description?.en ?? '', ar: editData.description?.ar ?? '' },
          imageUrl: editData.imageUrl ?? '',
          discountPercentage: editData.discountPercentage ?? 0,
          subscriptionPeriodDays: editData.subscriptionPeriodDays ?? 30,
          giftPeriodDays: editData.giftPeriodDays ?? 0,
          loyaltyPointsAwarded: editData.loyaltyPointsAwarded ?? '',
          loyaltyPointsRequired: editData.loyaltyPointsRequired ?? '',
          medicalLoyaltyPointsAwarded: editData.medicalLoyaltyPointsAwarded ?? '',
          medicalLoyaltyPointsRequired: editData.medicalLoyaltyPointsRequired ?? '',
          crown: editData.crown ?? { en: '', ar: '' },
        });
        
        // Extract pricing from editData.prices array
        const subscriptionPrices = {};
        const medicalPrices = {};
        
        if (editData.prices && Array.isArray(editData.prices)) {
          editData.prices.forEach(price => {
            if (price.type === 'NORMAL') {
              subscriptionPrices[price.currency] = price.amount.toString();
            } else if (price.type === 'MEDICAL') {
              // Allow medical prices to have decimal values
              medicalPrices[price.currency] = parseFloat(price.amount).toString();
            }
          });
        }
        
        setPricing({
          subscription: {
            EGP: subscriptionPrices.EGP ?? '',
            SAR: subscriptionPrices.SAR ?? '',
            AED: subscriptionPrices.AED ?? '',
            USD: subscriptionPrices.USD ?? ''
          },
          medical: {
            EGP: medicalPrices.EGP ?? '',
            SAR: medicalPrices.SAR ?? '',
            AED: medicalPrices.AED ?? '',
            USD: medicalPrices.USD ?? ''
          }
        });
        
        // Set period values
        const periodDays = editData.subscriptionPeriodDays ?? 30;
        const giftDays = editData.giftPeriodDays ?? 0;
        
        if (periodDays >= 30) {
          setPeriodType('months');
          setPeriodValue(Math.floor(periodDays / 30).toString());
        } else if (periodDays >= 7) {
          setPeriodType('weeks');
          setPeriodValue(Math.floor(periodDays / 7).toString());
        } else {
          setPeriodType('days');
          setPeriodValue(periodDays.toString());
        }
        
        if (giftDays >= 30) {
          setGiftPeriodType('months');
          setGiftPeriodValue(Math.floor(giftDays / 30).toString());
        } else if (giftDays >= 7) {
          setGiftPeriodType('weeks');
          setGiftPeriodValue(Math.floor(giftDays / 7).toString());
        } else {
          setGiftPeriodType('days');
          setGiftPeriodValue(giftDays.toString());
        }
        
        // Benefits are handled in a separate useEffect
        const hasLoyaltyPoints = (editData.loyaltyPointsAwarded !== null && editData.loyaltyPointsAwarded > 0) || (editData.loyaltyPointsRequired !== null && editData.loyaltyPointsRequired > 0) || (editData.medicalLoyaltyPointsAwarded !== null && editData.medicalLoyaltyPointsAwarded > 0) || (editData.medicalLoyaltyPointsRequired !== null && editData.medicalLoyaltyPointsRequired > 0);
        setEnableLoyaltyPoints(hasLoyaltyPoints);
        const hasCrown = editData.crown && (editData.crown.en ?? editData.crown.ar);
        setEnableCrown(hasCrown);
        setCrownColor(editData.crownColor ?? '#3F0071');
        // Debug logs removed for production
        setImageUrl(editData.imageUrl ?? '');
      } else {
        // Reset form when modal opens for new plan
        setFormData({
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          imageUrl: '',
          discountPercentage: 0,
          subscriptionPeriodDays: 30,
          giftPeriodDays: 0,
          loyaltyPointsAwarded: '',
          loyaltyPointsRequired: '',
          medicalLoyaltyPointsAwarded: '',
          medicalLoyaltyPointsRequired: '',
          crown: { en: '', ar: '' },
        });
        
        // Reset pricing
        setPricing({
          subscription: { EGP: '', SAR: '', AED: '', USD: '' },
          medical: { EGP: '', SAR: '', AED: '', USD: '' }
        });
        
        // Reset crown color to default purple
        setCrownColor('#3F0071');
        setPeriodType('days');
        setGiftPeriodType('days');
        setPeriodValue('30');
        setGiftPeriodValue('0');
        // Only reset benefits for new plans, not when editing
        if (!isEdit) {
          setBenefits([]);
          setBenefitsInitialized(false); // Reset benefits initialization flag for new plans
        }
        setEnableLoyaltyPoints(false);
        setEnableCrown(false);
        setImageUrl(''); // Reset imageUrl only for new plans
      }
      
      setNewBenefit({ en: '', ar: '' });
      setShowNewBenefit(false);
      setBenefitSearch('');
      setError(null);
      setEditingBenefit(null);
      setEditBenefit({ en: '', ar: '' });
      fetchBenefits();
    }
  }, [isOpen, isEdit, editData?.id]); // Only depend on modal open state and plan ID, not the entire editData object

  // Separate effect to handle benefits initialization - only runs when modal opens for editing
  useEffect(() => {
    if (isOpen && isEdit && editData && !benefitsInitialized) {
      // Transform benefits from backend format to frontend format
      const transformedBenefits = (editData.benefits ?? []).map(item => ({
        id: item.benefit?.id ?? item.id,
        description: item.benefit?.description ?? item.description,
      }));
      setBenefitsSafely(transformedBenefits);
      setBenefitsInitialized(true);
    }
  }, [isOpen, isEdit, editData?.id, benefitsInitialized]);



  const fetchBenefits = async() => {
    try {
      const response = await adminApiService.getBenefits();
      // The backend returns { items: [...], total: ... }
      const benefits = response.items || response.data || response || [];
      setAvailableBenefits(Array.isArray(benefits) ? benefits : []);
    } catch (err) {
      console.error('Error fetching benefits:', err);
      setAvailableBenefits([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    
    // Clear error when user starts typing in the field that had an error
    if (errorField === name) {
      setError(null);
      setErrorField(null);
    }
  };

  const handleBilingualInputChange = (field, language, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [language]: value,
      },
    }));
  };

  const handlePricingChange = (type, currency, value) => {
    setPricing(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [currency]: value,
      },
    }));
  };

  // Function to calculate medical prices based on regular prices and factor
  const calculateMedicalPrices = () => {
    const currencies = ['EGP', 'SAR', 'AED', 'USD'];
    const newMedicalPricing = { ...pricing.medical };
    const factorValue = parseFloat(medicalFactor) || 0;
    
      currencies.forEach(currency => {
        const regularPrice = parseFloat(pricing.subscription[currency]);
        if (regularPrice > 0) {
          // Calculate medical price: regular price + (factor% of regular price)
          const factorDecimal = factorValue / 100;
          const medicalPrice = regularPrice + (regularPrice * factorDecimal);
          // Allow decimal values for medical prices
          newMedicalPricing[currency] = medicalPrice.toFixed(2);
        }
      });
    
    setPricing(prev => ({
      ...prev,
      medical: newMedicalPricing,
    }));
    
    showSuccess(`Medical prices calculated with ${factorValue}% factor!`);
  };

  const convertToDays = (value, type) => {
    switch (type) {
      case 'weeks':
        return value * 7;
      case 'months':
        return value * 30; // Approximate
      case 'days':
      default:
        return value;
    }
  };

  const handlePeriodChange = (value, type) => {
    setPeriodValue(value);
    setPeriodType(type);
    const days = convertToDays(parseInt(value) || 0, type);
    setFormData(prev => ({
      ...prev,
      subscriptionPeriodDays: days,
    }));
  };

  const handleGiftPeriodChange = (value, type) => {
    setGiftPeriodValue(value);
    setGiftPeriodType(type);
    const days = convertToDays(parseInt(value) || 0, type);
    setFormData(prev => ({
      ...prev,
      giftPeriodDays: days,
    }));
  };


  const addExistingBenefit = (benefit) => {
    // Debug logs removed for production
    if (benefit && benefit.id && !benefits.find(b => b.id === benefit.id)) {
      setBenefits(prev => {
        const newBenefits = [...prev, benefit];
        // Debug logs removed for production
        return newBenefits;
      });
      // Clear search to show the selected benefits section
      setBenefitSearch('');
      showSuccess('Benefit added successfully!');
    }
  };

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = benefits.findIndex((item) => item.id === active.id);
      const newIndex = benefits.findIndex((item) => item.id === over.id);

      const newBenefits = arrayMove(benefits, oldIndex, newIndex);
      setBenefits(newBenefits);

      // If we're in edit mode, update the order on the backend
      if (isEdit && editData) {
        try {
          await adminApiService.updateSubscriptionPlanBenefitOrder(editData.id, newBenefits);
          showSuccess('Benefit order updated successfully!');
        } catch (error) {
          console.error('Error updating benefit order:', error);
          showError('Failed to update benefit order');
          // Revert the change on error
          setBenefits(benefits);
        }
      }
    }
  }, [benefits, isEdit, editData, showSuccess, showError]);

  const addNewBenefit = async() => {
    if (newBenefit.en.trim() && newBenefit.ar.trim()) {
      try {
        const benefitData = {
          description: {
            en: newBenefit.en.trim(),
            ar: newBenefit.ar.trim(),
          },
        };
        const response = await adminApiService.createBenefit(benefitData);
        const createdBenefit = response.benefit || response;
        if (createdBenefit && createdBenefit.id) {
          setBenefits(prev => [...prev, createdBenefit]);
          setAvailableBenefits(prev => Array.isArray(prev) ? [...prev, createdBenefit] : [createdBenefit]);
          setNewBenefit({ en: '', ar: '' });
          setShowNewBenefit(false);
          showSuccess('New benefit created and added successfully!');
        }
      } catch (err) {
        console.error('Error creating benefit:', err);
        showError('Failed to create benefit. Please try again.');
      }
    }
  };

  const removeBenefit = (id) => {
    setBenefits(prev => prev.filter(benefit => {
      const benefitId = benefit?.id || benefit?.benefit?.id;
      return benefitId !== id;
    }));
    showSuccess('Benefit removed successfully!');
  };

  const startEditBenefit = (benefit, scope = 'plan-only') => {
    const benefitToEdit = benefit?.benefit ?? benefit;
    setEditingBenefit(benefitToEdit);
    setEditingBenefitScope(scope);
    setEditBenefit({
      en: benefitToEdit?.description?.en ?? '',
      ar: benefitToEdit?.description?.ar ?? '',
    });
  };

  const cancelEditBenefit = () => {
    setEditingBenefit(null);
    setEditingBenefitScope(null);
    setEditBenefit({ en: '', ar: '' });
  };

  const saveEditBenefit = async() => {
    if (editBenefit.en.trim() && editBenefit.ar.trim() && editingBenefit) {
      try {
        if (editingBenefitScope === 'global') {
          // Global edit: Update the benefit for all plans
          const benefitData = {
            description: {
              en: editBenefit.en.trim(),
              ar: editBenefit.ar.trim(),
            },
          };
          const response = await adminApiService.updateBenefit(editingBenefit.id, benefitData);
          const updatedBenefit = response.benefit || response;
          
          if (updatedBenefit && updatedBenefit.id) {
            // Update in available benefits (global)
            setAvailableBenefits(prev => prev.map(b => 
              b.id === editingBenefit.id ? updatedBenefit : b,
            ));
            // Update in selected benefits if it exists there
            setBenefits(prev => prev.map(b => 
              b.id === editingBenefit.id ? updatedBenefit : b,
            ));
            setEditingBenefit(null);
            setEditingBenefitScope(null);
            setEditBenefit({ en: '', ar: '' });
            showSuccess('Benefit updated globally for all plans!');
          }
        } else {
          // Plan-only edit: Create a new benefit and update the subscription plan to use it
          const newBenefitData = {
            description: {
              en: editBenefit.en.trim(),
              ar: editBenefit.ar.trim(),
            },
          };
          
          // Create new benefit in the backend
          const response = await adminApiService.createBenefit(newBenefitData);
          const newBenefit = response.benefit || response;
          
          if (newBenefit && newBenefit.id) {
            // Update in available benefits (add the new benefit)
            setAvailableBenefits(prev => [...prev, newBenefit]);
            
            // Update in selected benefits (replace the old benefit with the new one)
            const updatedBenefits = benefits.map(b => 
              b.id === editingBenefit.id ? newBenefit : b,
            );
            setBenefits(updatedBenefits);
            
            // If we're in edit mode, immediately update the subscription plan with the new benefit
            if (isEdit && editData) {
              try {
                // Prepare pricing data for submission
                const prices = [];
                
                // Add subscription prices
                Object.entries(pricing.subscription).forEach(([currency, amount]) => {
                  if (amount && parseFloat(amount) > 0) {
                    prices.push({
                      amount: parseFloat(amount),
                      currency: currency,
                      type: 'NORMAL'
                    });
                  }
                });
                
                // Add medical prices (allow decimal values)
                Object.entries(pricing.medical).forEach(([currency, amount]) => {
                  if (amount && parseFloat(amount) > 0) {
                    prices.push({
                      amount: parseFloat(amount),
                      currency: currency,
                      type: 'MEDICAL'
                    });
                  }
                });

                const subscriptionData = {
                  ...formData,
                  imageUrl: imageUrl || '',
                  benefits: updatedBenefits.map(b => b.id).filter(Boolean),
                  prices: prices,
                  loyaltyPointsAwarded: enableLoyaltyPoints && formData.loyaltyPointsAwarded ? parseFloat(formData.loyaltyPointsAwarded) : null,
                  loyaltyPointsRequired: enableLoyaltyPoints && formData.loyaltyPointsRequired ? parseFloat(formData.loyaltyPointsRequired) : null,
                  medicalLoyaltyPointsAwarded: enableLoyaltyPoints && formData.medicalLoyaltyPointsAwarded ? parseFloat(formData.medicalLoyaltyPointsAwarded) : null,
                  medicalLoyaltyPointsRequired: enableLoyaltyPoints && formData.medicalLoyaltyPointsRequired ? parseFloat(formData.medicalLoyaltyPointsRequired) : null,
                  crown: enableCrown ? formData.crown : null,
                  crownColor: enableCrown ? crownColor : null,
                };
                
                await adminApiService.updateSubscriptionPlan(editData.id, subscriptionData);
                showSuccess('New benefit created and subscription plan updated!');
              } catch (err) {
                console.error('Error updating subscription plan:', err);
                showError('Benefit created but failed to update subscription plan. Please save the form to apply changes.');
              }
            } else {
              showSuccess('New benefit created and will be added when you save the plan!');
            }
            
            setEditingBenefit(null);
            setEditingBenefitScope(null);
            setEditBenefit({ en: '', ar: '' });
          }
        }
      } catch (err) {
        console.error('Error updating benefit:', err);
        showError('Failed to update benefit. Please try again.');
      }
    }
  };

  const handleDeleteBenefit = async(benefitId, scope = 'global') => {
    if (scope === 'global') {
      if (window.confirm('Are you sure you want to delete this benefit globally? This will remove it from ALL plans and cannot be undone.')) {
        try {
          await adminApiService.deleteBenefit(benefitId);
          // Remove from selected benefits
          setBenefits(prev => prev.filter(b => b.id !== benefitId));
          // Remove from available benefits
          setAvailableBenefits(prev => prev.filter(b => b.id !== benefitId));
          // If we're editing this benefit, cancel edit mode
          if (editingBenefit?.id === benefitId) {
            setEditingBenefit(null);
            setEditingBenefitScope(null);
            setEditBenefit({ en: '', ar: '' });
          }
          showSuccess('Benefit deleted globally from all plans!');
        } catch (err) {
          console.error('Error deleting benefit:', err);
          showError('Failed to delete benefit. Please try again.');
        }
      }
    } else {
      // Plan-only removal
      setBenefits(prev => prev.filter(b => b.id !== benefitId));
      showSuccess('Benefit removed from this plan only!');
    }
  };

  const filteredBenefits = Array.isArray(availableBenefits) ? availableBenefits.filter(benefit => 
    benefit?.description?.en?.toLowerCase().includes(benefitSearch.toLowerCase()) ||
    benefit?.description?.ar?.toLowerCase().includes(benefitSearch.toLowerCase()),
  ) : [];

  const scrollToError = (fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
      });
      element.focus();
    }
  };

  const showFormError = (message, fieldName = null) => {
    setError(message);
    setErrorField(fieldName);
    if (fieldName) {
      setTimeout(() => scrollToError(fieldName), 100);
    }
  };


  const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorField(null);

    // Client-side validation for loyalty points
    if (enableLoyaltyPoints) {
      if (!formData.loyaltyPointsRequired || parseFloat(formData.loyaltyPointsRequired) <= 0) {
        showFormError('Loyalty points required must be greater than 0', 'loyaltyPointsRequired');
        setLoading(false);
        return;
      }
    }

    // Client-side validation for pricing - all currencies are required
    const requiredCurrencies = ['EGP', 'SAR', 'AED', 'USD'];
    
    // Check subscription pricing
    for (const currency of requiredCurrencies) {
      const amount = pricing.subscription[currency];
      if (!amount || parseFloat(amount) <= 0) {
        showFormError(`Subscription price (${currency}) is required and must be greater than 0`, 'pricing');
        setLoading(false);
        return;
      }
    }
    
    // Check medical pricing
    for (const currency of requiredCurrencies) {
      const amount = pricing.medical[currency];
      if (!amount || parseFloat(amount) <= 0) {
        showFormError(`Medical price (${currency}) is required and must be greater than 0`, 'pricing');
        setLoading(false);
        return;
      }
    }

    try {
      // Debug logs removed for production
      // Prepare pricing data for submission
      const prices = [];
      
      // Add subscription prices
      Object.entries(pricing.subscription).forEach(([currency, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          prices.push({
            amount: parseFloat(amount),
            currency: currency,
            type: 'NORMAL'
          });
        }
      });
      
      // Add medical prices (allow decimal values)
      Object.entries(pricing.medical).forEach(([currency, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          prices.push({
            amount: parseFloat(amount),
            currency: currency,
            type: 'MEDICAL'
          });
        }
      });

      // Prepare benefits data - include both IDs and any modified descriptions
      const benefitsData = benefits.map(benefit => {
        // If the benefit has been modified locally (has custom description), include the full data
        if (benefit.description && (benefit.description.en || benefit.description.ar)) {
          return {
            id: benefit.id,
            description: benefit.description
          };
        }
        // Otherwise, just send the ID
        return benefit.id;
      }).filter(Boolean);

      const subscriptionData = {
        ...formData,
        imageUrl: imageUrl || '', // Send empty string, backend will transform to undefined
        benefits: benefitsData,
        prices: prices,
        // Include loyalty points fields (null when disabled, actual values when enabled)
        loyaltyPointsAwarded: enableLoyaltyPoints && formData.loyaltyPointsAwarded ? parseFloat(formData.loyaltyPointsAwarded) : null,
        loyaltyPointsRequired: enableLoyaltyPoints && formData.loyaltyPointsRequired ? parseFloat(formData.loyaltyPointsRequired) : null,
        medicalLoyaltyPointsAwarded: enableLoyaltyPoints && formData.medicalLoyaltyPointsAwarded ? parseFloat(formData.medicalLoyaltyPointsAwarded) : null,
        medicalLoyaltyPointsRequired: enableLoyaltyPoints && formData.medicalLoyaltyPointsRequired ? parseFloat(formData.medicalLoyaltyPointsRequired) : null,
        crown: enableCrown ? formData.crown : null,
        crownColor: enableCrown ? crownColor : null,
      };
      // Debug logs removed for production

      if (isEdit && editData) {
        await adminApiService.updateSubscriptionPlan(editData.id, subscriptionData);
        showSuccess('Subscription plan updated successfully!');
      } else {
        await adminApiService.createSubscriptionPlan(subscriptionData);
        showSuccess('Subscription plan created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create subscription plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    {errorField && (
                      <p className="text-xs text-red-600 mt-1">
                        Please check the highlighted field below
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setErrorField(null);
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name.en ?? ''}
                  onChange={(e) => handleBilingualInputChange('name', 'en', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter plan name in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name (Arabic) *
                </label>
                <input
                  type="text"
                  value={formData.name.ar ?? ''}
                  onChange={(e) => handleBilingualInputChange('name', 'ar', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل اسم الخطة بالعربية"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description.en ?? ''}
                  onChange={(e) => handleBilingualInputChange('description', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter plan description in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.description.ar ?? ''}
                  onChange={(e) => handleBilingualInputChange('description', 'ar', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل وصف الخطة بالعربية"
                  dir="rtl"
                />
              </div>

              {/* Regular Subscription Pricing */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800">Regular Subscription Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (EGP) *
                    </label>
                    <input
                      type="number"
                      value={pricing.subscription.EGP ?? ''}
                      onChange={(e) => handlePricingChange('subscription', 'EGP', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (SAR) *
                    </label>
                    <input
                      type="number"
                      value={pricing.subscription.SAR ?? ''}
                      onChange={(e) => handlePricingChange('subscription', 'SAR', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (AED) *
                    </label>
                    <input
                      type="number"
                      value={pricing.subscription.AED ?? ''}
                      onChange={(e) => handlePricingChange('subscription', 'AED', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      value={pricing.subscription.USD ?? ''}
                      onChange={(e) => handlePricingChange('subscription', 'USD', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Price Calculator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-blue-800">Medical Price Calculator</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-blue-700">
                      Factor (%):
                    </label>
                    <input
                      type="number"
                      value={medicalFactor ?? ''}
                      onChange={(e) => setMedicalFactor(e.target.value)}
                      min="0"
                      max="1000"
                      className="w-16 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-600">
                    Medical price = Regular price + ({medicalFactor}% of regular price)
                  </p>
                  <button
                    type="button"
                    onClick={calculateMedicalPrices}
                    disabled={!pricing.subscription.EGP && !pricing.subscription.SAR && !pricing.subscription.AED && !pricing.subscription.USD}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Calculator className="h-4 w-4" />
                    Calculate
                  </button>
                </div>
              </div>

              {/* Medical Subscription Pricing */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800">Medical Subscription Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Price (EGP) *
                    </label>
                    <input
                      type="number"
                      value={pricing.medical.EGP ?? ''}
                      onChange={(e) => handlePricingChange('medical', 'EGP', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Price (SAR) *
                    </label>
                    <input
                      type="number"
                      value={pricing.medical.SAR ?? ''}
                      onChange={(e) => handlePricingChange('medical', 'SAR', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Price (AED) *
                    </label>
                    <input
                      type="number"
                      value={pricing.medical.AED ?? ''}
                      onChange={(e) => handlePricingChange('medical', 'AED', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Price (USD) *
                    </label>
                    <input
                      type="number"
                      value={pricing.medical.USD ?? ''}
                      onChange={(e) => handlePricingChange('medical', 'USD', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage ?? ''}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>

            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Plan Image</h3>
              <AdminImageUpload
                initialImage={imageUrl ? { url: imageUrl } : null}
                onImageUpload={(uploadedImage) => setImageUrl(uploadedImage.url)}
                onImageRemove={() => setImageUrl('')}
                maxSize={5 * 1024 * 1024}
                showPreview={true}
                showDetails={true}
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Period *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={periodValue ?? ''}
                    onChange={(e) => handlePeriodChange(e.target.value, periodType)}
                    required
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                  <select
                    value={periodType ?? 'days'}
                    onChange={(e) => handlePeriodChange(periodValue, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  = {formData.subscriptionPeriodDays} days
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gift Period
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={giftPeriodValue ?? ''}
                    onChange={(e) => handleGiftPeriodChange(e.target.value, giftPeriodType)}
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                  <select
                    value={giftPeriodType ?? 'days'}
                    onChange={(e) => handleGiftPeriodChange(giftPeriodValue, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  = {formData.giftPeriodDays} days
                </p>
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Loyalty Points & Rewards</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableLoyaltyPoints}
                  onChange={(e) => {
                    setEnableLoyaltyPoints(e.target.checked);
                    if (!e.target.checked) {
                      // When disabling loyalty points, set all values to empty strings
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: '',
                        loyaltyPointsRequired: '',
                        medicalLoyaltyPointsAwarded: '',
                        medicalLoyaltyPointsRequired: '',
                      }));
                    } else {
                      // When enabling loyalty points, set minimum values
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: prev.loyaltyPointsAwarded ?? '0',
                        loyaltyPointsRequired: prev.loyaltyPointsRequired ?? '1',
                        medicalLoyaltyPointsAwarded: prev.medicalLoyaltyPointsAwarded ?? '0',
                        medicalLoyaltyPointsRequired: prev.medicalLoyaltyPointsRequired ?? '0',
                      }));
                    }
                  }}
                  className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable loyalty points & rewards</span>
              </label>
            </div>
            
            {enableLoyaltyPoints ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Points Awarded
                    </label>
                    <input
                      type="number"
                      name="loyaltyPointsAwarded"
                      value={formData.loyaltyPointsAwarded ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Points Required
                    </label>
                    <input
                      type="number"
                      name="loyaltyPointsRequired"
                      value={formData.loyaltyPointsRequired ?? ''}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                        errorField === 'loyaltyPointsRequired' 
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter points required (minimum 1)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 1 point required for redemption
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Points Awarded
                    </label>
                    <input
                      type="number"
                      name="medicalLoyaltyPointsAwarded"
                      value={formData.medicalLoyaltyPointsAwarded ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Points Required
                    </label>
                    <input
                      type="number"
                      name="medicalLoyaltyPointsRequired"
                      value={formData.medicalLoyaltyPointsRequired ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="Enter medical points required"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Medical plan loyalty points (optional)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-500 mb-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No Loyalty Rewards</h4>
                <p className="text-sm text-gray-600">
                  This subscription plan will not include any loyalty points or rewards system.
                </p>
              </div>
            )}
          </div>

          {/* Crown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Crown Badge & Card Styling</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableCrown}
                  onChange={(e) => {
                    setEnableCrown(e.target.checked);
                    if (!e.target.checked) {
                      // When disabling crown, clear the crown data
                      setFormData(prev => ({
                        ...prev,
                        crown: { en: '', ar: '' },
                      }));
                    }
                  }}
                  className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable crown badge & custom styling</span>
              </label>
            </div>
            
            {enableCrown ? (
              <div className="space-y-6">
                {/* Crown Text */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Crown Text</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crown Text (English)
                      </label>
                      <input
                        type="text"
                        name="crown.en"
                        value={formData.crown.en ?? ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          crown: { ...prev.crown, en: e.target.value },
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder="e.g., Premium, VIP, Exclusive"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crown Text (Arabic)
                      </label>
                      <input
                        type="text"
                        name="crown.ar"
                        value={formData.crown.ar ?? ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          crown: { ...prev.crown, ar: e.target.value },
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder="مثل: مميز، VIP، حصري"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                {/* Crown & Border Color */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Crown & Border Color</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crown & Border Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={crownColor ?? '#3F0071'}
                        onChange={(e) => setCrownColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={crownColor ?? '#3F0071'}
                        onChange={(e) => setCrownColor(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder="#3F0071"
                      />
                      <button
                        type="button"
                        onClick={() => setCrownColor('#3F0071')}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      >
                        Use Default
                      </button>
                    </div>
                  </div>
                </div>


                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        The crown badge and border will be displayed on the subscription plan card to highlight special or premium plans.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-500 mb-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No Crown Badge</h4>
                <p className="text-sm text-gray-600">
                  This subscription plan will not display a crown badge or custom border styling.
                </p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Plan Benefits</h3>
            
            {/* Search existing benefits */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={benefitSearch ?? ''}
                  onChange={(e) => setBenefitSearch(e.target.value)}
                  placeholder="Search existing benefits..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                />
              </div>
              
              {benefitSearch && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {Array.isArray(filteredBenefits) && filteredBenefits.map((benefit) => (
                    <div
                      key={benefit?.id || Math.random()}
                      className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => addExistingBenefit(benefit)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {benefit?.description?.en || 'No English description'}
                          </div>
                          <div className="text-sm text-gray-600" dir="rtl">
                            {benefit?.description?.ar || 'لا يوجد وصف بالعربية'}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add the benefit to selected benefits if not already there
                              if (!benefits.find(b => b.id === benefit.id)) {
                                addExistingBenefit(benefit);
                              }
                              // Start editing immediately
                              startEditBenefit(benefit, 'global');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit this benefit - This will update the benefit for ALL plans that use it"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBenefit(benefit.id, 'global');
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete this benefit - This will remove it from ALL plans that use it"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(filteredBenefits) || filteredBenefits.length === 0) && (
                    <div className="p-3 text-sm text-gray-500">No benefits found</div>
                  )}
                </div>
              )}
            </div>

            {/* Add new benefit */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowNewBenefit(!showNewBenefit)}
                className="flex items-center gap-2 text-gymmawy-primary hover:text-gymmawy-secondary"
              >
                <Plus className="h-4 w-4" />
                {showNewBenefit ? 'Cancel' : 'Add New Benefit'}
              </button>

              {showNewBenefit && (
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefit (English) *
                    </label>
                    <input
                      type="text"
                      value={newBenefit.en ?? ''}
                      onChange={(e) => setNewBenefit(prev => ({ ...prev, en: e.target.value }))}
                      placeholder="Enter benefit in English"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefit (Arabic) *
                    </label>
                    <input
                      type="text"
                      value={newBenefit.ar ?? ''}
                      onChange={(e) => setNewBenefit(prev => ({ ...prev, ar: e.target.value }))}
                      placeholder="أدخل الميزة بالعربية"
                      dir="rtl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addNewBenefit}
                    className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
                  >
                    Create Benefit
                  </button>
                </div>
              )}
            </div>

            {/* Selected benefits */}
            {Array.isArray(benefits) && benefits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Benefits (Drag to reorder):</h4>
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={benefits.map(benefit => benefit.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {benefits.map((benefit) => {
                      const benefitId = benefit?.id || benefit?.benefit?.id;
                      const isEditing = editingBenefit?.id === benefitId;
                      return (
                        <SortableBenefit
                          key={benefitId || Math.random()}
                          benefit={benefit}
                          onEdit={startEditBenefit}
                          onDelete={handleDeleteBenefit}
                        >
                    {isEditing ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-800">
                            {editingBenefitScope === 'global' ? 'Edit Benefit Globally' : 'Create New Benefit for This Plan'}
                          </h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            editingBenefitScope === 'global' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {editingBenefitScope === 'global' ? 'Global Edit' : 'Create New Benefit'}
                          </span>
                        </div>
                        {editingBenefitScope === 'global' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-red-700 font-medium">
                                  Warning: This will update the benefit for ALL plans that use it!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {editingBenefitScope === 'plan-only' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-green-700 font-medium">
                                  This will create a new benefit and link it to this plan only. Other plans will keep the original benefit.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            English Description
                          </label>
                          <input
                            type="text"
                            value={editBenefit.en ?? ''}
                            onChange={(e) => setEditBenefit(prev => ({ ...prev, en: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gymmawy-primary focus:border-transparent"
                            placeholder="Enter English description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Arabic Description
                          </label>
                          <input
                            type="text"
                            value={editBenefit.ar ?? ''}
                            onChange={(e) => setEditBenefit(prev => ({ ...prev, ar: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gymmawy-primary focus:border-transparent"
                            placeholder="أدخل الوصف بالعربية"
                            dir="rtl"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEditBenefit}
                            disabled={!editBenefit.en.trim() || !editBenefit.ar.trim()}
                            className="px-3 py-1 text-xs bg-gymmawy-primary text-white rounded hover:bg-gymmawy-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editingBenefitScope === 'global' ? 'Update Globally' : 'Create New Benefit'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditBenefit}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {(benefit?.benefit?.description?.en || benefit?.description?.en) || 'No English description'}
                          </div>
                          <div className="text-sm text-gray-600" dir="rtl">
                            {(benefit?.benefit?.description?.ar || benefit?.description?.ar) || 'لا يوجد وصف بالعربية'}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => startEditBenefit(benefit, 'plan-only')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Create a new benefit for this plan only - Other plans will keep the original benefit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBenefit(benefitId, 'plan-only')}
                            className="text-red-600 hover:text-red-800"
                            title="Remove this benefit - This will only remove it from this plan, other plans will keep it"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                        )}
                        </SortableBenefit>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;
