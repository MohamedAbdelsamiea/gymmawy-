import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, User, LogOut, ShoppingBag, Gift, Home, ShoppingCart, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useReactiveLanguage } from "../../hooks/useLanguageUpdate";
import languageEventService from "../../services/languageEventService";
import { useCart } from "../../contexts/CartContext";
import logo from "/assets/common/logo.webp"; // import your logo directly
import { getGymmawyCoinIcon } from "../../utils/currencyUtils";

const Header = () => {
  const { t, i18n } = useTranslation("header"); // using "header" namespace
  const { isRTL } = useReactiveLanguage(); // Get reactive RTL state
  const { user, logout } = useAuth();
  const { getCartTotals } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileProfileDropdownOpen, setMobileProfileDropdownOpen] = useState(false);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [isHomeDropdownToggling, setIsHomeDropdownToggling] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const mobileProfileDropdownRef = useRef(null);
  const homeDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on desktop profile dropdown button or inside desktop profile dropdown
      const isClickOnDesktopProfileButton = profileDropdownRef.current && 
        profileDropdownRef.current.contains(event.target);
      
      // Check if click is on mobile profile dropdown button or inside mobile profile dropdown
      const isClickOnMobileProfileButton = mobileProfileDropdownRef.current && 
        mobileProfileDropdownRef.current.contains(event.target);
      
      // Check if click is on home dropdown button or inside home dropdown
      const isClickOnHomeButton = homeDropdownRef.current && 
        homeDropdownRef.current.contains(event.target);
      
      // Only close desktop profile dropdown if clicking outside it
      if (profileDropdownRef.current && !isClickOnDesktopProfileButton) {
        setProfileDropdownOpen(false);
      }
      
      // Only close mobile profile dropdown if clicking outside it
      if (mobileProfileDropdownRef.current && !isClickOnMobileProfileButton) {
        setMobileProfileDropdownOpen(false);
      }
      
      // Only close home dropdown if clicking outside it
      if (homeDropdownRef.current && !isClickOnHomeButton) {
        setHomeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Update navigation when language changes
  useEffect(() => {
    setNavItems(getNavItems());
  }, [i18n.language]);

  // Close home dropdown when mobile menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setHomeDropdownOpen(false);
      setIsHomeDropdownToggling(false);
    }
  }, [isMenuOpen]);

  // Reset toggling flag when dropdown state changes
  useEffect(() => {
    if (!homeDropdownOpen) {
      const timer = setTimeout(() => {
        setIsHomeDropdownToggling(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [homeDropdownOpen]);

  // Get navigation items based on language
  const getNavItems = () => {
    const isArabic = i18n.language === 'ar';
    
    if (isArabic) {
      // Arabic: Store moved to right side
      return [
        { key: "home", isDropdown: true },
        { key: "trainingPrograms", path: "/programmes", isPage: true },
        { key: "store", path: "/store", isPage: true },
        { key: "rewards", path: "/rewards", isPage: true },
        { key: "contactUs", path: "/contact", isPage: true },
        { key: "languageToggle", isToggle: true },
      ];
    } else {
      // English: Store stays in left side
      return [
        { key: "home", isDropdown: true },
        { key: "trainingPrograms", path: "/programmes", isPage: true },
        { key: "store", path: "/store", isPage: true },
        { key: "rewards", path: "/rewards", isPage: true },
        { key: "contactUs", path: "/contact", isPage: true },
        { key: "languageToggle", isToggle: true },
      ];
    }
  };

  // Get home dropdown items (sections on home page)
  const getHomeDropdownItems = () => {
    return [
      { key: "transformations", sectionId: "results" },
      { key: "packages", sectionId: "packages" },
      { key: "partners", sectionId: "partners" },
    ];
  };



  const handleNavigation = (item) => {
    if (item.isToggle || item.isLogo) {
      return;
    }

    if (item.isDropdown) {
      // Prevent rapid toggling
      if (isHomeDropdownToggling) {
        return;
      }
      
      setIsHomeDropdownToggling(true);
      setHomeDropdownOpen(!homeDropdownOpen);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsHomeDropdownToggling(false);
      }, 300);
      
      return;
    }

    if (item.isSection) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(item.sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const element = document.getElementById(item.sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
      setIsMenuOpen(false);
      setHomeDropdownOpen(false);
    } else if (item.isPage) {
      navigate(item.path);
      setIsMenuOpen(false);
    }
  };

  const handleHomeSectionNavigation = (sectionItem) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionItem.sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionItem.sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setHomeDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    console.log('Header: Language toggle clicked, changing to:', newLang);
    
    // Notify the language event service immediately
    languageEventService.notifyLanguageChange(newLang);
    
    // Change the language in i18n
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async() => {
    try {
      await logout();
      navigate('/');
      setProfileDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDashboardNavigation = () => {
    if (user?.role === 'admin') {
      navigate('/dashboard/admin');
    } else {
      navigate('/dashboard');
    }
    setProfileDropdownOpen(false);
  };

  const handleHomeNavigation = () => {
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const handleProfileNavigation = () => {
    navigate('/dashboard/profile');
    setProfileDropdownOpen(false);
  };

  // Check if user is currently in dashboard (including checkout as it's a protected area)
  const isInDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/checkout');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#190143] text-[#ebebeb] shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between xlg:justify-between">
        {/* Left Navigation */}
        <nav className="hidden xlg:flex items-center justify-end" style={{ width: 'calc(50% - 100px)' }}>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-12' : 'space-x-12'}`}>
             {navItems.slice(0, 4).map((item) => (
              item.isDropdown ? (
                <div key={item.key} className="relative" ref={homeDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation(item);
                    }}
                    className="hover:text-white transition-colors duration-300 font-medium whitespace-nowrap flex items-center gap-1"
                  >
                    {t(`nav.${item.key}`)}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${homeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Home Dropdown Menu */}
                  {homeDropdownOpen && (
                    <div className={`absolute ${i18n.language === 'ar' ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
                      {getHomeDropdownItems().map((dropdownItem) => (
                        <button
                          key={dropdownItem.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHomeSectionNavigation(dropdownItem);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                          style={isRTL ? { direction: 'rtl' } : {}}
                        >
                          <span className="whitespace-nowrap">{t(`nav.${dropdownItem.key}`)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item)}
                  className="hover:text-white transition-colors duration-300 font-medium whitespace-nowrap"
                >
                  {t(`nav.${item.key}`)}
                </button>
              )
            ))}
          </div>
        </nav>

        {/* Center Logo - Desktop */}
        <div className="hidden xlg:flex flex-shrink-0 items-center">
          <button 
            onClick={() => {
              if (location.pathname === "/") {
                // If already on home page, scroll to top
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth'
                });
              } else {
                // Navigate to home page
                navigate("/");
              }
            }} 
            className="flex items-center"
          >
            <img src={logo} alt="Gymmawy Logo" className="h-8 w-auto" />
          </button>
        </div>

        {/* Mobile Layout: Logo + Avatar + Burger Menu */}
        <div className="xlg:hidden flex items-center justify-between w-full">
          {/* Mobile Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => {
                if (location.pathname === "/") {
                  // If already on home page, scroll to top
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                } else {
                  // Navigate to home page
                  navigate("/");
                }
              }} 
              className="flex items-center"
            >
              <img src={logo} alt="Gymmawy Logo" className="h-8 w-auto" />
            </button>
          </div>

          {/* Mobile Avatar - Centered */}
          {user && (
            <div className="flex items-center">
              <div className="relative" ref={mobileProfileDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileProfileDropdownOpen(!mobileProfileDropdownOpen);
                  }}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium whitespace-nowrap`}
                >
                  <div className="h-8 w-8 rounded-full bg-gymmawy-accent flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span>{user?.firstName}</span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-200 ${mobileProfileDropdownOpen ? 'rotate-180' : ''} ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`} 
                  />
                </button>
                
                {/* Mobile Profile Dropdown Menu */}
                {mobileProfileDropdownOpen && (
                  <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
                    {/* Gymmawy Coins - Only for regular users, not admins */}
                    {user?.role !== 'ADMIN' && user?.role !== 'admin' && (
                       <div className="px-2 py-2 text-sm text-gray-600" style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}>
                         <div className="flex items-center gap-2">
                           {getGymmawyCoinIcon({ size: 32, className: "flex-shrink-0" })}
                           <span className="text-gymmawy-accent font-medium whitespace-nowrap">
                             {user.loyaltyPoints || 0} {t('auth.loyaltyPoints')}
                           </span>
                         </div>
                       </div>
                    )}
                    
                    {/* Conditional Navigation Link */}
                    {isInDashboard ? (
                      /* Home Link - Show when in Dashboard */
                      <button
                        onClick={handleHomeNavigation}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                        style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                      >
                        <Home className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{t('auth.home')}</span>
                      </button>
                    ) : (
                      /* Dashboard Link - Show when in Homepage */
                      <button
                        onClick={handleDashboardNavigation}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                        style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                      >
                        <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{t('auth.dashboard')}</span>
                      </button>
                    )}
                    
                    {/* Profile Settings Link */}
                    <button
                      onClick={handleProfileNavigation}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                      style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t('auth.profileSettings')}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                      style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t('auth.signOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Right Navigation */}
        <nav className="hidden xlg:flex items-center justify-start" style={{ width: 'calc(50% - 100px)' }}>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-12' : 'space-x-12'}`}>
            {navItems.slice(4, 5).map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item)}
                className="hover:text-white transition-colors duration-300 font-medium whitespace-nowrap"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
            
            {/* Authentication Section */}
          {user ? (
            <div className="flex items-center">
              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium whitespace-nowrap`}
                >
                  <div className="h-8 w-8 rounded-full bg-gymmawy-accent flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span>{user?.firstName}</span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''} ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`} 
                  />
                </button>
                
                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
                    {/* Gymmawy Coins - Only for regular users, not admins */}
                    {user?.role !== 'ADMIN' && user?.role !== 'admin' && (
                       <div className="px-2 py-2 text-sm text-gray-600" style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}>
                         <div className="flex items-center gap-2">
                           {getGymmawyCoinIcon({ size: 32, className: "flex-shrink-0" })}
                           <span className="text-gymmawy-accent font-medium whitespace-nowrap">
                             {user.loyaltyPoints || 0} {t('auth.loyaltyPoints')}
                           </span>
                         </div>
                       </div>
                    )}
                    
                    {/* Conditional Navigation Link */}
                    {isInDashboard ? (
                      /* Home Link - Show when in Dashboard */
                      <button
                        onClick={handleHomeNavigation}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                        style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                      >
                        <Home className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{t('auth.home')}</span>
                      </button>
                    ) : (
                      /* Dashboard Link - Show when in Homepage */
                      <button
                        onClick={handleDashboardNavigation}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                        style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                      >
                        <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{t('auth.dashboard')}</span>
                      </button>
                    )}
                    
                    {/* Profile Settings Link */}
                    <button
                      onClick={handleProfileNavigation}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                      style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t('auth.profileSettings')}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                      style={i18n.language === 'ar' ? { direction: 'rtl' } : {}}
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t('auth.signOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth/login')}
              className="hover:text-white transition-colors duration-300 font-medium whitespace-nowrap"
            >
              {t('auth.login')}
            </button>
          )}
          
            {/* Cart Button */}
            <button
              onClick={() => navigate('/cart')}
              className={`relative flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium whitespace-nowrap`}
            >
              <ShoppingCart size={20} />
              <span>{t('cart')}</span>
              {getCartTotals().itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartTotals().itemCount}
                </span>
              )}
            </button>
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium whitespace-nowrap`}
            >
              <Globe size={20} />
              <span>{i18n.language === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </nav>

      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="xlg:hidden pb-4 border-t px-4 border-white/20">
          <div className="flex flex-col space-y-4 pt-4">
            {navItems
              .filter((item) => !item.isToggle)
              .map((item) => (
                item.isDropdown ? (
                  <div key={item.key} className="flex flex-col">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigation(item);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="hover:text-white transition-colors duration-300 font-medium text-left flex items-center gap-2 touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {t(`nav.${item.key}`)}
                      <ChevronDown size={16} className={`transition-transform duration-200 ${homeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Mobile Home Dropdown Items */}
                    {homeDropdownOpen && (
                      <div className="ml-4 mt-2 flex flex-col space-y-2">
                        {getHomeDropdownItems().map((dropdownItem) => (
                          <button
                            key={dropdownItem.key}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleHomeSectionNavigation(dropdownItem);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="hover:text-white transition-colors duration-300 font-medium text-left text-sm opacity-80 block w-full touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            {t(`nav.${dropdownItem.key}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.key}
                    onClick={(e) => {
                      // Only close dropdown if it's open and this is not the home dropdown
                      if (homeDropdownOpen && item.key !== 'home') {
                        setHomeDropdownOpen(false);
                      }
                      handleNavigation(item);
                    }}
                    className="hover:text-white transition-colors duration-300 font-medium text-left"
                  >
                    {t(`nav.${item.key}`)}
                  </button>
                )
              ))}
            
            {/* Mobile Authentication Section - Only show login for non-authenticated users */}
            {!user && (
              <div className="border-t border-white/20 pt-4 space-y-3">
                <button
                  onClick={() => {
                    setHomeDropdownOpen(false);
                    navigate('/auth/login');
                    setIsMenuOpen(false);
                  }}
                  className={`hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  {t('auth.login')}
                </button>
              </div>
            )}
            
            {/* Mobile Cart Button */}
            <button
              onClick={() => {
                setHomeDropdownOpen(false);
                navigate('/cart');
                setIsMenuOpen(false);
              }}
              className={`relative flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
            >
              <ShoppingCart size={20} />
              <span>{t('cart')}</span>
              {getCartTotals().itemCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                  {getCartTotals().itemCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                setHomeDropdownOpen(false);
                toggleLanguage();
              }}
              className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
            >
              <Globe size={20} />
              <span>{i18n.language === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
