import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, User, LogOut, ShoppingBag, Gift, Home } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import logo from "/assets/common/logo.webp"; // import your logo directly

const Header = () => {
  const { t, i18n } = useTranslation("header"); // using "header" namespace
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update navigation when language changes
  useEffect(() => {
    setNavItems(getNavItems());
  }, [i18n.language]);

  // Get navigation items based on language
  const getNavItems = () => {
    const isArabic = i18n.language === 'ar';
    
    if (isArabic) {
      // Arabic: Store moved to right side
      return [
        { key: "packages", sectionId: "packages", isSection: true },
        { key: "trainingPrograms", path: "/programmes", isPage: true },
        { key: "transformations", sectionId: "results", isSection: true },
        { key: "subscribeNow", sectionId: "packages", isSection: true },
        { key: "store", path: "/store", isPage: true },
        { key: "partners", sectionId: "partners", isSection: true },
        { key: "joinTheTeam", sectionId: "packages", isSection: true },
        { key: "contactUs", path: "/contact", isPage: true },
        { key: "languageToggle", isToggle: true },
      ];
    } else {
      // English: Store stays in left side
      return [
        { key: "packages", sectionId: "packages", isSection: true },
        { key: "trainingPrograms", path: "/programmes", isPage: true },
        { key: "transformations", sectionId: "results", isSection: true },
        { key: "subscribeNow", sectionId: "packages", isSection: true },
        { key: "store", path: "/store", isPage: true },
        { key: "partners", sectionId: "partners", isSection: true },
        { key: "joinTheTeam", sectionId: "packages", isSection: true },
        { key: "contactUs", path: "/contact", isPage: true },
        { key: "languageToggle", isToggle: true },
      ];
    }
  };



  const handleNavigation = (item) => {
    if (item.isToggle || item.isLogo) {
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
    } else if (item.isPage) {
      navigate(item.path);
      setIsMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
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
    <header className="bg-[#190143] text-[#ebebeb] shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left Navigation */}
        <nav className="hidden lg:flex items-center justify-end" style={{ width: 'calc(50% - 100px)' }}>
          <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-12' : 'space-x-12'}`}>
            {navItems.slice(0, i18n.language === 'ar' ? 5 : 5).map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item)}
                className="hover:text-white transition-colors duration-300 font-medium whitespace-nowrap"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
          </div>
        </nav>

        {/* Center Logo */}
        <div className="flex-shrink-0">
          <button onClick={() => navigate("/")}>
            <img src={logo} alt="Gymmawy Logo" className="h-8 w-auto" />
          </button>
        </div>

        {/* Right Navigation */}
        <nav className="hidden lg:flex items-center justify-start" style={{ width: 'calc(50% - 100px)' }}>
          <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-12' : 'space-x-12'}`}>
            {navItems.slice(i18n.language === 'ar' ? 5 : 5, 8).map((item) => (
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
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium whitespace-nowrap`}
                >
                  <div className="h-8 w-8 rounded-full bg-gymmawy-accent flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span>{user?.firstName}</span>
                </button>
                
                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className={`absolute ${i18n.language === 'ar' ? 'right-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
                    {/* Loyalty Points - Only for regular users, not admins */}
                    {user?.role !== 'ADMIN' && user?.role !== 'admin' && (
                      <div className={`px-4 py-2 text-sm text-gray-600 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                          <Gift className="h-4 w-4 text-gymmawy-accent" />
                          <span className="text-gymmawy-accent font-medium">
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
                        className={`block w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                      >
                        <Home className={`inline h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {t('auth.home')}
                      </button>
                    ) : (
                      /* Dashboard Link - Show when in Homepage */
                      <button
                        onClick={handleDashboardNavigation}
                        className={`block w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                      >
                        <ShoppingBag className={`inline h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {t('auth.dashboard')}
                      </button>
                    )}
                    
                    {/* Profile Settings Link */}
                    <button
                      onClick={handleProfileNavigation}
                      className={`block w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    >
                      <User className={`inline h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.profileSettings')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`block w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    >
                      <LogOut className={`inline h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('auth.signOut')}
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="lg:hidden pb-4 border-t px-4 border-white/20">
          <div className="flex flex-col space-y-4 pt-4">
            {navItems
              .filter((item) => !item.isToggle)
              .map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavigation(item)}
                  className="hover:text-white transition-colors duration-300 font-medium text-left"
                >
                  {t(`nav.${item.key}`)}
                </button>
              ))}
            
            {/* Mobile Authentication Section */}
            {user ? (
              <div className="border-t border-white/20 pt-4 space-y-3">
                {/* User Name Display */}
                <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm font-medium`}>
                  <div className="h-6 w-6 rounded-full bg-gymmawy-accent flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span>{user?.firstName}</span>
                </div>
                
                {/* Loyalty Points - Only for regular users, not admins */}
                {user?.role !== 'ADMIN' && user?.role !== 'admin' && (
                  <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} text-sm`}>
                    <Gift className="h-4 w-4 text-gymmawy-accent" />
                    <span className="text-gymmawy-accent font-medium">
                      {user.loyaltyPoints || 0} {t('auth.loyaltyPoints')}
                    </span>
                  </div>
                )}
                
                {/* Dashboard Link */}
                <button
                  onClick={() => {
                    handleDashboardNavigation();
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <ShoppingBag size={20} />
                  <span>{t('auth.dashboard')}</span>
                </button>
                
                <button
                  onClick={() => {
                    handleDashboardNavigation();
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <User size={20} />
                  <span>{t('auth.profileSettings')}</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'} hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <LogOut size={20} />
                  <span>{t('auth.signOut')}</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-white/20 pt-4 space-y-3">
                <button
                  onClick={() => {
                    navigate('/auth/login');
                    setIsMenuOpen(false);
                  }}
                  className={`hover:text-white transition-colors duration-300 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  {t('auth.login')}
                </button>
              </div>
            )}
            
            <button
              onClick={toggleLanguage}
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
