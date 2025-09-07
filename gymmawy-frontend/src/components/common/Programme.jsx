// src/components/Programme.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Programme({ image, name, price, programme }) {
    const { t } = useTranslation('programmes');
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handlePurchase = () => {
      if (!isAuthenticated) {
        // Redirect to login with return path
        navigate('/auth/login', { 
          state: { from: '/checkout', plan: programme, type: 'programme' } 
        });
        return;
      }

      if (!programme?.id) {
        alert('Programme information is not available');
        return;
      }

      // Navigate to checkout with programme data
      navigate('/checkout', {
        state: {
          plan: {
            id: programme.id,
            name: programme.name,
            description: programme.description,
            price: programme.price,
            priceEGP: programme.priceEGP,
            priceSAR: programme.priceSAR,
            discountPercentage: programme.discountPercentage || 0,
            benefits: programme.benefits || [],
            image: programme.image || programme.imageUrl
          },
          type: 'programme'
        }
      });
    };

    return (
      <div className="bg-[#190143] overflow-hidden flex flex-col">
        <img src={image} alt={name} className="w-full h-auto object-cover" />
        <div className="p-4 flex flex-col flex-grow text-left">
          <h3 className="text-2xl font-bold mb-2">{name}</h3>
          <p className={`text-2xl mb-4 ${price === 'FREE' || price === 'مجاني' ? 'text-orange-500 font-bold' : ''}`}>{price}</p>
          <button 
            onClick={handlePurchase}
            disabled={loading}
            className="mt-auto w-full bg-[#281159] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#3f0071] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("purchasing") : t("button")}
          </button>
        </div>
      </div>
    );
  }
  