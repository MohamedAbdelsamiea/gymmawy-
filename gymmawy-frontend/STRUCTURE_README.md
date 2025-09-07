# Gymmawy Frontend - Project Structure

This document outlines the new, production-ready structure for the Gymmawy frontend project.

## 📁 Project Structure

```
gymmawy-frontend/
│── public/                     # Static assets (favicon, index.html, robots.txt, etc.)
│
│── src/
│   ├── assets/                 # Images, icons, fonts, videos
│   │   ├── en/                 # English version assets
│   │   └── ar/                 # Arabic version assets
│   │
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Shared UI (buttons, inputs, modals, loaders, etc.)
│   │   ├── layout/             # Navbar, Footer, Sidebar, LanguageSwitcher
│   │   └── dashboard/          # Components specific to dashboard
│   │
│   ├── pages/                  # Main website pages
│   │   ├── Home/               # Homepage with hero, features, etc.
│   │   ├── Programmes/         # Training programs page
│   │   ├── Store/              # E-commerce store
│   │   ├── JoinUs/             # Membership packages, partners, transformations
│   │   ├── ContactUs/          # Contact information and form
│   │   ├── Auth/               # Login, Register, Forgot Password
│   │   └── Dashboard/          # User Dashboard pages
│   │       ├── Overview/       # Dashboard overview with stats
│   │       ├── Orders/         # User order history
│   │       ├── Subscriptions/  # User subscription management
│   │       └── Rewards/        # Points and rewards system
│   │
│   ├── admin/                  # Admin dashboard
│   │   ├── components/         # Admin-only components (tables, charts, etc.)
│   │   └── pages/              # Admin pages (Orders, Users, Content, Analytics)
│   │
│   ├── contexts/               # React Context (AuthContext, LanguageContext, ThemeContext)
│   │
│   ├── hooks/                  # Custom hooks (useAuth, useFetch, useLocalStorage, etc.)
│   │
│   ├── i18n/                   # Internationalization
│   │   ├── translations.js     # English & Arabic translations
│   │   ├── i18n.js             # Config for react-i18next
│   │   └── locales/            # Language-specific files
│   │
│   ├── services/               # API calls (axios or fetch wrappers)
│   │   ├── authService.js      # Authentication API calls
│   │   ├── userService.js      # User management API calls
│   │   ├── storeService.js     # Store/e-commerce API calls
│   │   └── adminService.js     # Admin API calls
│   │
│   ├── utils/                  # Helpers (formatDate, validators, constants)
│   │
│   ├── styles/                 # Global styles (Tailwind config / SCSS / CSS)
│   │   └── globals.css         # Global CSS file
│   │
│   ├── App.jsx                 # Root component with routing
│   ├── routes.jsx              # App routes (protected + public routes)
│   ├── main.jsx                # ReactDOM render entry
│   └── config.js               # Global config (API base URL, env vars)
│
│── package.json
│── vite.config.js              # Vite bundler config
│── tailwind.config.js          # Tailwind CSS config
│── .env                        # Environment variables
```

## 🚀 Key Features

### 1. **Modular Architecture**
- Clear separation of concerns
- Reusable components and services
- Easy to maintain and scale

### 2. **Internationalization (i18n)**
- English and Arabic support
- Centralized translations
- RTL language support

### 3. **Authentication System**
- JWT-based authentication
- Protected routes
- User context management

### 4. **Service Layer**
- Centralized API calls
- Error handling
- Request/response interceptors

### 5. **Dashboard System**
- User dashboard with overview, orders, subscriptions, rewards
- Admin panel for content management
- Responsive design

## 🔧 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd gymmawy-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## 📱 Available Routes

### Public Routes
- `/` - Homepage
- `/programmes` - Training programs
- `/store` - E-commerce store
- `/join-us` - Membership packages
- `/contact` - Contact information
- `/auth/*` - Authentication pages

### Protected Routes (Require Authentication)
- `/dashboard/*` - User dashboard

### Admin Routes (Require Admin Privileges)
- `/admin/*` - Admin panel

## 🎨 Component Usage

### Using the Language Context
```jsx
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { language, isRTL, toggleLanguage } = useLanguage();
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <button onClick={toggleLanguage}>
        {language === 'en' ? 'العربية' : 'English'}
      </button>
    </div>
  );
};
```

### Using the Auth Context
```jsx
import { useAuth } from '../hooks/useAuth';

const ProtectedComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### Using Services
```jsx
import authService from '../services/authService';

const LoginForm = () => {
  const handleLogin = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      // Handle successful login
    } catch (error) {
      // Handle error
    }
  };
  
  // ... rest of component
};
```

## 🧪 Custom Hooks

### useLocalStorage
```jsx
import { useLocalStorage } from '../hooks/useLocalStorage';

const [theme, setTheme] = useLocalStorage('theme', 'light');
```

### useFetch
```jsx
import { useFetch } from '../hooks/useFetch';

const { data, loading, error, refetch } = useFetch('/api/users');
```

## 🔒 Security Features

- JWT token management
- Protected routes
- API authentication headers
- Secure storage practices

## 🌐 Internationalization

The app supports English and Arabic with:
- Automatic language detection
- RTL layout support
- Centralized translation management
- Dynamic content switching

## 📊 State Management

- React Context for global state
- Local state for component-specific data
- Service layer for API state
- Custom hooks for reusable logic

## 🚀 Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 🤝 Contributing

1. Follow the established folder structure
2. Use the provided service layer for API calls
3. Implement proper error handling
4. Add translations for new text content
5. Test with both English and Arabic languages
6. Ensure responsive design for all screen sizes

## 📝 Notes

- All imports have been updated to reflect the new structure
- Existing functionality has been preserved
- New placeholder components have been added for missing features
- The build process has been tested and verified
- All routes are properly configured and working

## 🔄 Migration from Old Structure

The refactoring has been completed with:
- ✅ All files moved to new locations
- ✅ Import paths updated
- ✅ Routes reconfigured
- ✅ Build process verified
- ✅ No functionality lost

Your existing code is now organized in a clean, production-ready structure that follows React best practices!
