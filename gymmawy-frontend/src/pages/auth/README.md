# Authentication Pages - Gymmawy Platform

This directory contains all the authentication-related pages for the Gymmawy platform, built with React, Tailwind CSS, and following the project's design system.

## 🎯 Features

### Pages Included
- **Login** (`/auth/login`) - User sign-in with email/password
- **Register** (`/auth/register`) - New user registration
- **Forgot Password** (`/auth/forgot-password`) - Password reset request
- **Reset Password** (`/auth/reset-password`) - New password setup
- **Email Verification** (`/auth/email-verification`) - Email verification page

### Design Features
- ✅ **Gymmawy Theme Integration** - Uses project's color palette and branding
- ✅ **Responsive Design** - Mobile-first approach with Tailwind CSS
- ✅ **RTL Support** - Full Arabic language support
- ✅ **Multilingual** - English/Arabic translations via i18next
- ✅ **Floating Label Inputs** - Modern, accessible form inputs
- ✅ **Form Validation** - Client-side validation with error messages
- ✅ **Loading States** - User feedback during API calls
- ✅ **Success/Error Handling** - Comprehensive error management

## 🏗️ Architecture

### Components Structure
```
src/components/auth/
├── FloatingInput.jsx    # Reusable floating label input
├── AuthButton.jsx       # Styled button with loading states
├── AuthCard.jsx         # Card container with logo and styling
├── AuthLink.jsx         # Styled navigation links
└── index.js            # Component exports

src/pages/auth/
├── Login.jsx           # Login page
├── Register.jsx        # Registration page
├── ForgotPassword.jsx  # Password reset request
├── ResetPassword.jsx   # Password reset form
├── EmailVerification.jsx # Email verification
└── index.js           # Page exports
```

### Translation Files
```
public/locales/
├── en/auth.json       # English translations
└── ar/auth.json       # Arabic translations
```

## 🎨 Design System

### Colors Used
- **Primary**: `#3F0071` (Gymmawy Purple)
- **Secondary**: `#8B5CF6` (Light Purple)
- **Accent**: `#FF6B35` (Orange)
- **Success**: Green variants for success states
- **Error**: Red variants for error states

### Typography
- **Headers**: Inter font family
- **Body**: Arial/System fonts
- **Arabic**: Noto Sans Arabic for RTL support

### Components
- **FloatingInput**: Animated labels with validation states
- **AuthButton**: Multiple variants (primary, secondary, outline)
- **AuthCard**: Centered card with logo and consistent spacing
- **AuthLink**: Styled navigation links

## 🔧 Usage

### Basic Setup
The auth pages are already integrated into the routing system:

```jsx
// In your app routing
<Route path="/auth/*" element={<Auth />} />
```

### Navigation
```jsx
import { useNavigate } from 'react-router-dom';

// Navigate to login
navigate('/auth/login');

// Navigate to register
navigate('/auth/register');
```

### Authentication Context
The pages use the existing `AuthContext` for state management:

```jsx
import { useAuth } from '../../contexts/AuthContext';

const { login, register, loading, error } = useAuth();
```

## 🌐 API Integration

### Endpoints Used
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `POST /auth/resend-verification` - Resend verification email
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Service Methods
All API calls are handled through `authService.js`:
- `login(credentials)`
- `register(userData)`
- `forgotPassword(email)`
- `resetPassword(token, password)`
- `resendVerificationEmail(email)`

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 640px` - Single column, full width
- **Tablet**: `640px - 1024px` - Optimized spacing
- **Desktop**: `> 1024px` - Full layout with proper spacing

### RTL Support
- Automatic text direction based on language
- Proper spacing and alignment for Arabic
- Font family switching for Arabic text

## 🔒 Security Features

### Form Validation
- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, number)
- Phone number validation
- Required field validation
- Real-time error clearing

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 🚀 Getting Started

1. **Access the pages**:
   - Login: `/auth/login`
   - Register: `/auth/register`
   - Forgot Password: `/auth/forgot-password`

2. **Customize styling**:
   - Modify `tailwind.config.js` for color changes
   - Update component styles in individual files

3. **Add translations**:
   - Edit `public/locales/en/auth.json` for English
   - Edit `public/locales/ar/auth.json` for Arabic

4. **Configure API**:
   - Update `src/config.js` with your API base URL
   - Ensure backend endpoints match the service calls

## 🎯 Next Steps

- [ ] Add social login options (Google, Facebook)
- [ ] Implement two-factor authentication
- [ ] Add password strength indicator
- [ ] Create user onboarding flow
- [ ] Add biometric authentication support

## 📞 Support

For questions or issues with the authentication system, please refer to the main project documentation or contact the development team.
