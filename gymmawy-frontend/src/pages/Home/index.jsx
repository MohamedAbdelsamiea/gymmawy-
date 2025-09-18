import { useTranslation } from "react-i18next";
import { Play, ChevronDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import * as Accordion from "@radix-ui/react-accordion";
import { useAsset } from "../../hooks/useAsset";
import { useAuth } from "../../contexts/AuthContext";
import JoinUsButton from "../../components/common/JoinUsButton";
import VideoPlayer from "../../components/common/VideoPlayer";
import videoService from "../../services/videoService";
import transformationService from "../../services/transformationService";
import subscriptionService from "../../services/subscriptionService";
import { config } from "../../config";

const HomePage = () => {
  const { t, i18n } = useTranslation("home");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [transformations, setTransformations] = useState([]);
  const [transformationsLoading, setTransformationsLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanOptions, setSelectedPlanOptions] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [plansCurrency, setPlansCurrency] = useState('EGP');

  // Fetch featured video
  useEffect(() => {
    const fetchFeaturedVideo = async() => {
      try {
        setVideoLoading(true);
        const video = await videoService.getFeaturedVideo();
        console.log('Featured video data:', video);
        setFeaturedVideo(video);
      } catch (error) {
        console.error('Error fetching featured video:', error);
      } finally {
        setVideoLoading(false);
      }
    };

    fetchFeaturedVideo();
  }, []);

  // Fetch transformations
  useEffect(() => {
    const fetchTransformations = async() => {
      try {
        setTransformationsLoading(true);
        console.log('=== FETCHING TRANSFORMATIONS ===');
        const response = await transformationService.getTransformations({
          isActive: true,
          language: i18n.language,
        });
        console.log('=== TRANSFORMATIONS RESPONSE ===');
        console.log('Response:', response);
        console.log('Transformations:', response.transformations);
        console.log('Transformations length:', response.transformations?.length);
        console.log('=====================================');
        setTransformations(response.transformations || []);
      } catch (error) {
        console.error('Error fetching transformations:', error);
      } finally {
        setTransformationsLoading(false);
      }
    };

    fetchTransformations();
  }, [i18n.language]);

  // Fetch subscription plans
  useEffect(() => {
    console.log('=== HOME PAGE useEffect TRIGGERED ===');
    console.log('i18n.language:', i18n.language);
    console.log('Timestamp:', Date.now());
    console.log('=====================================');
    
    const fetchSubscriptionPlans = async() => {
      try {
        setPlansLoading(true);
        setSubscriptionPlans([]); // Clear existing data first
        console.log('=== FETCHING SUBSCRIPTION PLANS ===');
        const response = await subscriptionService.getPlans(i18n.language);
        console.log('=== HOME PAGE SUBSCRIPTION PLANS ===');
        console.log('Response:', response);
        console.log('First plan:', response.items?.[0]);
        console.log('First plan subscriptionPeriodDays:', response.items?.[0]?.subscriptionPeriodDays);
        console.log('First plan giftPeriodDays:', response.items?.[0]?.giftPeriodDays);
        console.log('Currency from API:', response.currency);
        console.log('=====================================');
        setSubscriptionPlans(response.items || []);
        setPlansCurrency(response.currency || 'EGP');
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, [i18n.language]);

  // Helper function to get bilingual text
  const getBilingualText = (text, fallback = '') => {
    if (!text) {
return fallback;
}
    if (typeof text === 'object') {
      return i18n.language === 'ar' && text.ar 
        ? text.ar 
        : text.en || text.ar || fallback;
    }
    return text || fallback;
  };

  // Helper function to format subscription period
  const formatSubscriptionPeriod = (days) => {
    // Check if it's a clean week division (like 42 days = 6 weeks)
    if (days >= 7 && days % 7 === 0) {
      const weeks = days / 7;
      return i18n.language === 'ar' 
        ? `${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`
        : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    // Check if it's a clean month division (like 30, 60, 90 days)
    else if (days >= 30 && days % 30 === 0) {
      const months = days / 30;
      return i18n.language === 'ar' 
        ? `${months} ${months === 1 ? 'شهر' : 'شهور'}`
        : `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    // For other cases, prefer weeks if it's close to a week boundary
    else if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) {
        return i18n.language === 'ar' 
          ? `${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`
          : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      } else if (weeks >= 4) {
        // If 4+ weeks, show as months with remainder
        const months = Math.floor(days / 30);
        const remainingDaysAfterMonths = days % 30;
        if (remainingDaysAfterMonths === 0) {
          return i18n.language === 'ar' 
            ? `${months} ${months === 1 ? 'شهر' : 'شهور'}`
            : `${months} ${months === 1 ? 'month' : 'months'}`;
        } else {
          return i18n.language === 'ar' 
            ? `${months} ${months === 1 ? 'شهر' : 'شهور'} و ${remainingDaysAfterMonths} ${remainingDaysAfterMonths === 1 ? 'يوم' : 'أيام'}`
            : `${months} ${months === 1 ? 'month' : 'months'} and ${remainingDaysAfterMonths} ${remainingDaysAfterMonths === 1 ? 'day' : 'days'}`;
        }
      } else {
        return i18n.language === 'ar' 
          ? `${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'} و ${remainingDays} ${remainingDays === 1 ? 'يوم' : 'أيام'}`
          : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
      }
    } else {
      return i18n.language === 'ar' 
        ? `${days} ${days === 1 ? 'يوم' : 'أيام'}`
        : `${days} ${days === 1 ? 'day' : 'days'}`;
    }
  };

  // Helper function to format gift period
  const formatGiftPeriod = (days) => {
    if (days === 0) {
return '';
}
    return i18n.language === 'ar' 
      ? ` + ${formatSubscriptionPeriod(days)}`
      : ` + ${formatSubscriptionPeriod(days)}`;
  };

  // Handle plan option selection
  const handlePlanOptionChange = (planId, option) => {
    setSelectedPlanOptions(prev => ({
      ...prev,
      [planId]: option,
    }));
    // Close dropdown after selection
    setOpenDropdowns(prev => ({
      ...prev,
      [planId]: false,
    }));
  };

  // Toggle dropdown
  const toggleDropdown = (planId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle subscription plan selection
  const handleChoosePlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: '/checkout', plan, type: 'subscription' }, 
      });
      return;
    }

    navigate('/checkout', {
      state: {
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          medicalPrice: plan.medicalPrice,
          priceEGP: plan.priceEGP,
          priceSAR: plan.priceSAR,
          medicalEGP: plan.medicalEGP,
          medicalSAR: plan.medicalSAR,
          subscriptionPeriodDays: plan.subscriptionPeriodDays,
          giftPeriodDays: plan.giftPeriodDays,
          discountPercentage: plan.discountPercentage,
          benefits: plan.benefits || [],
          image: plan.image,
        },
        type: 'subscription',
      },
    });
  };

  // Helper function to calculate discounted price
  const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    if (discountPercentage > 0) {
      return originalPrice * (1 - discountPercentage / 100);
    }
    return originalPrice;
  };

  // Hero section assets
  const heroBg = useAsset("home/hero/hero-bg.webp", "common");
  const heroImage = useAsset("home/hero/hero-img.webp", "common");
  const heroText = useAsset("home/hero/hero-text.webp");
  
  // Why join section assets
  const angryIcon = useAsset("home/why-join/Angry.webp", "common");
  const whyJoinTitle = useAsset("home/why-join/why-to-join-text.webp");
  const videoThumbnail = useAsset("home/why-join/thumbnail.webp");
  const card1Bg = useAsset("home/why-join/card1-bg.webp", "common");
  const card2Bg = useAsset("home/why-join/card2-bg.webp", "common");
  const card3Bg = useAsset("home/why-join/card3-bg.webp", "common");
  const card1Icon = useAsset("home/why-join/card1-icon.webp", "common");
  const card2Icon = useAsset("home/why-join/card2-icon.webp", "common");
  const card3Icon = useAsset("home/why-join/card3-icon.webp", "common");

  // Membership section assets
  const membershipTitle = useAsset("home/membership/membership-text.webp");
  const dietCard = useAsset("home/membership/diet-card.webp", "common");
  const workoutCard = useAsset("home/membership/workout-card.webp", "common");
  const appCard = useAsset("home/membership/app-card.webp", "common");
  // Results section assets
  const resultsBg = useAsset("home/results/results-bg.webp", "common");
  const resultsTitle = useAsset("home/results/results-text.webp");

  // Packages section assets
  const packagesTitle = useAsset("home/packages/packages-text.webp");
  const package1Icon = useAsset("home/packages/package1-icon.webp", "common");
  const package2Icon = useAsset("home/packages/package2-icon.webp", "common");
  const package3Icon = useAsset("home/packages/package3-icon.webp", "common");
  const package4Icon = useAsset("home/packages/package4-icon.webp", "common");

  // Plan section assets
  const planTitle = useAsset("home/plan/plan-text.webp");

  // Partners section assets
  const partnerEvolve = useAsset("home/partners/evolve.webp", "common");
  const partnerCalo = useAsset("home/partners/calo.webp", "common");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {/* Hero Section */}
      <section
        className="relative py-4 lg:py-8 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-3 md:px-2 lg:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 items-end min-h-[500px] lg:min-h-[700px]">
            {/* Text Column */}
            <div
              className={`order-2 md:order-${
                i18n.language === "en" ? 1 : 4
              } lg:col-span-1 flex flex-col justify-end mb-16`}
            >
              <p className="text-2xl font-archivo font-normal text-[#ebebeb] mb-4 sm:mb-8">
                {t("hero.title")}
              </p>
              <div className="w-full max-w-sm mb-4 sm:mb-8">
                <img src={heroText} alt="Hero Text" className="w-full h-auto" />
              </div>
              <JoinUsButton />
            </div>

            {/* Hero Image Column */}
            <div className="order-1 md:order-2 lg:col-span-2 flex justify-center relative p-0">
              <img
                src={heroImage}
                alt="Gymmawy Hero"
                className="w-full h-auto lg:w-[500px] xl:w-[600px] transition-all duration-2000 ease-out"
              />
              <div className="absolute bottom-0 w-[320px] h-[320px] lg:w-[450px] lg:h-[450px] bg-[#172b8f] opacity-40 rounded-full blur-[120px] pointer-events-none"></div>
            </div>

            {/* Empty Column */}
            <div
              className={`order-3 md:order-${
                i18n.language === "en" ? 4 : 1
              } lg:col-span-1`}
            ></div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-8 md:py-12 bg-[#ebebeb]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="text-xl md:text-3xl text-[#190143] mb-10">
            {t("why-join.title")}
          </p>
          <h2
            className="text-3xl leading-normal md:text-4xl md:leading-normal lg:text-5xl lg:leading-normal font-semibold text-[#190143] mx-auto"
            dangerouslySetInnerHTML={{ __html: t("why-join.description") }}
          ></h2>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="bg-[#ebebeb]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-40 h-40 mx-auto mb-10">
              <img
                src={angryIcon}
                alt="Gymmawy Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-full max-w-3xl mx-auto mb-6">
              <img
                src={whyJoinTitle}
                alt="Why Join The Gymmawy Fam Today"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Video Player - Dynamic from CMS */}
          {!videoLoading && featuredVideo && (
            <div className="max-w-[1300px] mx-auto mb-12 px-4">
              <VideoPlayer
                videoUrl={featuredVideo.videoUrl.startsWith('http') ? featuredVideo.videoUrl : `http://localhost:3000${featuredVideo.videoUrl}`}
                thumbnailEn={featuredVideo.thumbnailEn ? (featuredVideo.thumbnailEn.startsWith('http') ? featuredVideo.thumbnailEn : `http://localhost:3000${featuredVideo.thumbnailEn}`) : null}
                thumbnailAr={featuredVideo.thumbnailAr ? (featuredVideo.thumbnailAr.startsWith('http') ? featuredVideo.thumbnailAr : `http://localhost:3000${featuredVideo.thumbnailAr}`) : null}
                title={featuredVideo.title?.en || featuredVideo.title?.ar || 'Featured Video'}
                className="rounded-lg"
                showControls={true}
                autoPlay={false}
                muted={false}
                hideIfNoVideo={true}
              />
            </div>
          )}

          {/* Feature Cards */}
          <div className="max-w-[1300px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
              {[
                {
                  background: card1Bg,
                  icon: card1Icon,
                  title: t("why-join.cards.0.title"),
                  description: t("why-join.cards.0.description"),
                },
                {
                  background: card2Bg,
                  icon: card2Icon,
                  title: t("why-join.cards.1.title"),
                  description: t("why-join.cards.1.description"),
                },
                {
                  background: card3Bg,
                  icon: card3Icon,
                  title: t("why-join.cards.2.title"),
                  description: t("why-join.cards.2.description"),
                },
              ].map((card, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl overflow-hidden bg-cover bg-center min-h-[160px] transition-all duration-700 ease-out ${
                    isVisible ? "animate-slide-up" : "opacity-0 translate-y-20"
                  }`}
                  style={{
                    backgroundImage: `url(${card.background})`,
                    animationDelay: `${index * 200}ms`,
                  }}
                >
                  <div className="relative p-5 pt-8 h-full flex flex-col">
                    {/* Top Row: Icon + Title + Description under Title */}
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={card.icon}
                          alt="Card Icon"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Title + Description */}
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-bold text-[#ebebeb] text-main-title mb-4">
                          {card.title}
                        </h3>
                        <p className="text-[#ebebeb] text-sm leading-relaxed text-body">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-16 md:py-20 bg-[#ebebeb]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xl md:text-3xl text-[#190143] mb-10 font-bold text-subtitle">
              {t("membership.title")}
            </p>
            <div className="w-full max-w-6xl mx-auto">
              <img
                src={membershipTitle}
                alt="Your membership in the Gymmawy community includes"
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                background: dietCard,
                title: t("membership.features.0.title"),
                description: t("membership.features.0.description"),
              },
              {
                background: workoutCard,
                title: t("membership.features.1.title"),
                description: t("membership.features.1.description"),
              },
              {
                background: appCard,
                title: t("membership.features.2.title"),
                description: t("membership.features.2.description"),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative rounded-2xl bg-contain bg-no-repeat bg-center overflow-hidden p-10 text-[#ebebeb] transition-all duration-700 ease-out flex flex-col justify-end items-start"
                style={{
                  backgroundImage: `url(${feature.background})`,
                  height: "620px", // fixed height for all cards
                  width: "380px", // fixed width for all cards
                }}
              >
                {/* Bottom Third Text */}
                <div className="text-left mb-16">
                  <h3 className="text-2xl font-bold mb-2 text-main-title">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-snug text-body">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="transform transition-transform duration-500 hover:scale-105 inline-block md:w-[450px]">
              <JoinUsButton />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section
        id="results"
        className="py-16 md:py-20 text-white relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${resultsBg})` }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <p className="section-subtitle text-xl md:text-3xl text-[#ebebeb] mb-12">
              {t("results")}
            </p>
            <div className="w-full max-w-xl mx-auto mb-6">
              <img
                src={resultsTitle}
                alt="Gymmawys Results"
                className="w-full h-auto"
              />
            </div>
          </div>
          {transformationsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-lg">
                  {i18n.language === 'ar' ? 'جاري تحميل النتائج...' : 'Loading results...'}
                </p>
              </div>
            </div>
          ) : transformations.length > 0 ? (
            <Slider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={3}
              slidesToScroll={1}
              centerMode={true}
              centerPadding="0px"
              responsive={[
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 2,
                  },
                },
                {
                  breakpoint: 640,
                  settings: {
                    slidesToShow: 1,
                  },
                },
              ]}
            >
              {transformations.map((transformation, index) => {
                // Get the appropriate title based on language
                const getTransformationTitle = () => {
                  if (typeof transformation.title === 'object') {
                    return i18n.language === 'ar' && transformation.title.ar 
                      ? transformation.title.ar 
                      : transformation.title.en || transformation.title.ar || 'Transformation';
                  }
                  return transformation.title || 'Transformation';
                };

                return (
                  <div key={transformation.id} className="px-2">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src={transformation.imageUrl ? (transformation.imageUrl.startsWith('http') ? transformation.imageUrl : `${config.API_BASE_URL}${transformation.imageUrl}`) : ''}
                        alt={getTransformationTitle()}
                        className="w-full h-auto object-cover rounded-lg shadow-lg transform transition-transform duration-500 hover:scale-105 hover:brightness-110"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </Slider>
          ) : (
            <div className="text-center py-20">
              <p className="text-white text-lg">
                {i18n.language === 'ar' 
                  ? 'لا توجد نتائج متاحة في الوقت الحالي' 
                  : 'No results available at the moment'
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 md:py-20 bg-[#ebebeb]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-base text-xl md:text-3xl text-[#190143] mb-6 font-bold text-subtitle">
              {t("packages.title")}
            </p>
            <div className="w-full max-w-4xl mx-auto">
              <img
                src={packagesTitle}
                alt={t("packages.title")}
                className="w-full h-auto "
              />
            </div>
          </div>

          {plansLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#190143] mx-auto mb-4"></div>
                <p className="text-[#190143] text-lg">
                  {i18n.language === 'ar' ? 'جاري تحميل الباقات...' : 'Loading packages...'}
                </p>
              </div>
            </div>
          ) : subscriptionPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionPlans.map((plan, index) => {
                // Debug: Log the plan data to see its structure
                console.log('🔍 Plan imageUrl:', plan.imageUrl);
                const planName = getBilingualText(plan.name, 'Package');
                const planDescription = getBilingualText(plan.description, '');
                
                // Get selected option for this plan (default to 'regular')
                const selectedOption = selectedPlanOptions[plan.id] || 'regular';
                
                // Determine which price to use based on selection
                let originalPrice = 0;
                let medicalPrice = 0;
                
                if (plan.price && plan.price.amount) {
                  originalPrice = parseFloat(plan.price.amount) || 0;
                } else if (plan.priceEGP) {
                  // Handle priceEGP as Prisma Decimal object
                  if (typeof plan.priceEGP === 'object' && plan.priceEGP.d && Array.isArray(plan.priceEGP.d)) {
                    // Prisma Decimal format: {s: 1, e: 3, d: [1999]}
                    const digits = plan.priceEGP.d.join('');
                    const exponent = plan.priceEGP.e || 0;
                    const sign = plan.priceEGP.s || 1;
                    originalPrice = parseFloat(digits) / Math.pow(10, digits.length - exponent - 1) * sign;
                  } else if (typeof plan.priceEGP === 'object' && plan.priceEGP.toString) {
                    originalPrice = parseFloat(plan.priceEGP.toString()) || 0;
                  } else {
                    originalPrice = parseFloat(plan.priceEGP) || 0;
                  }
                } else if (plan.price) {
                  originalPrice = parseFloat(plan.price) || 0;
                }
                
                // Get medical price if available
                if (plan.medicalPrice && plan.medicalPrice.amount) {
                  medicalPrice = parseFloat(plan.medicalPrice.amount) || 0;
                } else if (plan.medicalEGP) {
                  if (typeof plan.medicalEGP === 'object' && plan.medicalEGP.d && Array.isArray(plan.medicalEGP.d)) {
                    const digits = plan.medicalEGP.d.join('');
                    const exponent = plan.medicalEGP.e || 0;
                    const sign = plan.medicalEGP.s || 1;
                    medicalPrice = parseFloat(digits) / Math.pow(10, digits.length - exponent - 1) * sign;
                  } else if (typeof plan.medicalEGP === 'object' && plan.medicalEGP.toString) {
                    medicalPrice = parseFloat(plan.medicalEGP.toString()) || 0;
                  } else {
                    medicalPrice = parseFloat(plan.medicalEGP) || 0;
                  }
                }
                
                // Use the selected price
                const currentPrice = selectedOption === 'medical' ? medicalPrice : originalPrice;
                const discountedPrice = calculateDiscountedPrice(currentPrice, plan.discountPercentage || 0);
                const hasDiscount = (plan.discountPercentage || 0) > 0;
                
                // Get currency symbol from API response or use default
                let currencySymbol;
                const planCurrency = plan.price?.currency || plansCurrency || 'EGP';
                
                if (i18n.language === 'ar') {
                  // Arabic currency symbols
                  switch (planCurrency) {
                    case 'USD':
                      currencySymbol = '$';
                      break;
                    case 'SAR':
                      currencySymbol = 'رس';
                      break;
                    case 'EGP':
                    default:
                      currencySymbol = 'جم';
                      break;
                  }
                } else {
                  // English currency symbols
                  switch (planCurrency) {
                    case 'USD':
                      currencySymbol = '$';
                      break;
                    case 'SAR':
                      currencySymbol = 'S.R';
                      break;
                    case 'EGP':
                    default:
                      currencySymbol = 'L.E';
                      break;
                  }
                }
                
                return (
              <div
                key={index}
                className="relative bg-[#ebebeb] rounded-3xl border-[2px] shadow-lg flex flex-col"
                style={{
                  borderColor: plan.crownColor || '#190143'
                }}
              >
                {/* Crown badge above card - show when crown data is available */}
                {plan.crown && (plan.crown.en || plan.crown.ar) && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-2/3 z-20">
                    <div
                      className="
                        text-white 
                        text-center 
                        py-0.5 px-3
                        font-bold text-sm tracking-wide shadow-md
                        border-x-[3px] border-t-[3px]
                        relative overflow-hidden
                      "
                      style={{
                        backgroundColor: plan.crownColor || '#190143',
                        borderColor: plan.crownColor || '#190143',
                        borderTopLeftRadius: "15px",
                        borderTopRightRadius: "15px",
                        borderBottomLeftRadius: "0px",
                        borderBottomRightRadius: "0px",
                      }}
                    >
                      {getBilingualText(plan.crown, '')}
                    </div>
                  </div>
                )}

                {/* Card content */}
                <div className="p-6 flex flex-col flex-1 text-left items-start text-[#190143]">
                  {/* Plan Image */}
                  <div className="w-14 h-14 mb-4">
                    {plan.imageUrl ? (
                      <img
                        src={plan.imageUrl.startsWith('http') ? plan.imageUrl : `${config.API_BASE_URL}${plan.imageUrl}`}
                        alt={planName}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#190143] rounded-lg flex items-center justify-center">
                        <span className="text-[#ebebeb] font-bold text-lg">G</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Price */}
                  <h3 className="text-[1.75rem] font-bold text-main-title">
                    {planName}
                  </h3>
                  
                  {/* Price with discount display */}
                  <div className="mb-2 mt-1">
                    {hasDiscount && currentPrice > 0 ? (
                      <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                        <span className="text-2xl font-medium text-gray-500 line-through">
                          {currentPrice.toFixed(0)} {currencySymbol}
                        </span>
                        <span className="text-3xl font-bold text-red-600">
                          {discountedPrice.toFixed(0)} {currencySymbol}
                        </span>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                          -{plan.discountPercentage || 0}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl font-medium">
                        {currentPrice > 0 ? `${currentPrice.toFixed(0)} ${currencySymbol}` : 'Price not available'}
                      </span>
                    )}
                  </div>
                  
                  <p className="mb-4 text-lg">{planDescription}</p>

                  {/* Plan Options Dropdown */}
                  <div className="mb-4 w-full relative dropdown-container">
                    <div
                      onClick={() => toggleDropdown(plan.id)}
                      className="w-full bg-[#f8f8ff] border border-[#190143] rounded-lg p-3 text-[#190143] font-medium cursor-pointer flex items-center justify-between hover:bg-[#f0f0ff] transition-colors duration-200"
                    >
                      <span>
                        {selectedOption === 'regular' 
                          ? `${formatSubscriptionPeriod(plan.subscriptionPeriodDays)}${formatGiftPeriod(plan.giftPeriodDays)}`
                          : `${formatSubscriptionPeriod(plan.subscriptionPeriodDays)}${formatGiftPeriod(plan.giftPeriodDays)} (${i18n.language === 'ar' ? 'باقة طبية - اذا كان عندك اصابة او مرض مزمن' : 'Medical Package - If you have an injury or chronic condition'})`
                        }
                      </span>
                      <div className={`transform transition-transform duration-200 ${openDropdowns[plan.id] ? 'rotate-180' : ''}`}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    
                    {openDropdowns[plan.id] && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#190143] rounded-lg shadow-lg z-10">
                        <div
                          onClick={() => handlePlanOptionChange(plan.id, 'regular')}
                          className="p-3 hover:bg-[#f8f8ff] cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          {formatSubscriptionPeriod(plan.subscriptionPeriodDays)}
                          {formatGiftPeriod(plan.giftPeriodDays)}
                        </div>
                        <div
                          onClick={() => handlePlanOptionChange(plan.id, 'medical')}
                          className="p-3 hover:bg-[#f8f8ff] cursor-pointer"
                        >
                          {formatSubscriptionPeriod(plan.subscriptionPeriodDays)}
                          {formatGiftPeriod(plan.giftPeriodDays)} ({i18n.language === 'ar' ? 'باقة طبية - اذا كان عندك اصابة او مرض مزمن' : 'Medical Package - If you have an injury or chronic condition'})
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button 
                    onClick={() => handleChoosePlan(plan)}
                    className="w-full bg-[#190143] text-[#ebebeb] font-bold py-2 px-4 rounded-lg mb-4 hover:bg-[#2a0a5a] transition-colors duration-300"
                  >
                    {t("packages.choosePlan")}
                  </button>

                  {/* Features - using benefits from backend */}
                  {plan.benefits && plan.benefits.length > 0 && (
                    <ul className="space-y-2">
                      {plan.benefits.map((benefit, featureIndex) => {
                        const benefitDescription = getBilingualText(benefit.benefit?.description || benefit.description, '');
                        return (
                          <li
                            key={featureIndex}
                            className="flex items-start space-x-2"
                          >
                              <div
                              className={`
                                w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent mt-2 flex-shrink-0
                                ${
                                  i18n.language === "ar"
                                    ? "border-r-[8px] border-r-yellow-500 ml-2" // Arabic: flip + add left margin
                                    : "border-l-[8px] border-l-yellow-500 mr-2" // English: normal + add right margin
                                }
                              `}
                            />
                            <span className="text-sm text-body">
                              {benefitDescription}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#190143] text-lg">
                {i18n.language === 'ar' 
                  ? 'لا توجد باقات متاحة في الوقت الحالي' 
                  : 'No packages available at the moment'
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Plan Section */}
      <section className="py-16 md:py-20 bg-[#190143] text-[#ebebeb]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-xl md:text-3xl mb-6 font-bold text-subtitle">
              {t("plan.title")}
            </h2>
            <div className="w-full max-w-4xl mx-auto">
              <img
                src={planTitle}
                alt="TO ACHIEVE YOUR GOAL, YOU NEED A SIMPLE CLEAR PLAN."
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
            {t("plan.phases").map((phase, index) => (
              <div key={index} className="text-left">
                <h3 className="text-3xl font-bold mb-2 text-main-title">
                  {phase.title}
                </h3>
                <p className="text-[#ebebeb] text-body">{phase.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="transform transition-transform duration-500 hover:scale-105 inline-block mb-3 md:w-[450px]">
              <JoinUsButton />
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-16 md:py-20 bg-black text-[#ebebeb]">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-lg text-[#ebebeb] mb-3 text-subtitle">
                {t("partners.title")}
              </p>
              <h2 className="section-title text-[#ebebeb]">
                {t("partners.subtitle")}
              </h2>
            </div>

            {/* Logos */}
            <div className="flex justify-center lg:justify-end space-x-8">
              <div className="w-28 h-14">
                <img
                  src={partnerEvolve}
                  alt="EVOLVZ"
                  className="w-full h-full object-contain brightness-0 invert opacity-90"
                />
              </div>
              <div className="w-28 h-14">
                <img
                  src={partnerCalo}
                  alt="CALO"
                  className="w-full h-full object-contain brightness-0 invert opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-[#ebebeb]">
        <div className="container mx-auto px-8 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8 items-start">
            {/* Left Title */}
            <div>
              <p className="text-xl text-[#190143] mb-3">{t("faq.title")}</p>
              <h2 className="text-4xl md:text-5xl max-w-lg font-bold text-[#190143] md:leading-normal">
                {t("faq.subtitle")}
              </h2>
            </div>

            {/* Right Accordion */}
            <div className="max-w-[600px]">
              <Accordion.Root type="single" collapsible className="w-full">
                {t("faq.questions").map((question, idx) => (
                  <Accordion.Item
                    key={idx}
                    value={`item-${idx}`}
                    className="border-b border-[#190143]"
                  >
                    <Accordion.Header>
                      <Accordion.Trigger
                        className="
            group flex items-center justify-between w-full
            py-5 text-left text-[#190143] text-xl md:text-2xl
            font-medium leading-snug focus:outline-none
          "
                      >
                        <span className="mr-4">{question}</span>
                        <Plus className="h-6 w-6 text-[#190143] font-bold transition-transform duration-300 group-data-[state=open]:rotate-45" />
                      </Accordion.Trigger>
                    </Accordion.Header>

                    <Accordion.Content className="pb-5 text-base md:text-lg text-[#190143]/90 leading-relaxed">
                      <p>{t("faq.answers")[idx]}</p>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

