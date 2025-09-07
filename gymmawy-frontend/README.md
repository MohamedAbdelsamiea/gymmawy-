# Gymmawy Frontend

A modern, responsive fitness and community platform built with React, Vite, and Tailwind CSS. The website features bilingual support (English & Arabic) and a comprehensive multi-page structure.

## 🚀 Features

- **Modern Design**: Clean, professional fitness website design
- **Bilingual Support**: Full English and Arabic language support with RTL layout
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component-Based Architecture**: Modular React components for maintainability
- **Multi-Page Structure**: Complete website with navigation between pages
- **Language Context**: React Context for seamless language switching

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation header with language toggle
│   └── Footer.jsx      # Site footer with contact info
├── pages/              # Page components
│   ├── HomePage.jsx    # Main homepage with all sections
│   ├── PackagesPage.jsx
│   ├── TrainingProgramsPage.jsx
│   ├── TransformationsPage.jsx
│   ├── StorePage.jsx
│   ├── PartnersPage.jsx
│   └── ContactPage.jsx
├── contexts/           # React contexts
│   └── LanguageContext.jsx  # Language management
├── utils/              # Utility functions
│   └── translations.js # Bilingual text content
├── assets/             # Images, icons, and static files
├── App.jsx            # Main app component with routing
├── main.jsx           # Application entry point
└── index.css          # Global styles and Tailwind imports
```

## 🎨 Design System

The website uses a custom color palette defined in Tailwind config:

- **Primary**: Dark purple (#3F0071)
- **Secondary**: Purple (#8B5CF6)
- **Accent**: Orange (#FF6B35)
- **Dark**: Dark gray (#1F1F1F)
- **Light**: Light gray (#F8F9FA)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gymmawy-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🌐 Language Support

The website supports two languages:

- **English (en)**: Default language with LTR layout
- **Arabic (ar)**: RTL layout with Arabic typography

Language switching is handled through the `LanguageContext` and can be toggled using the globe icon in the header.

## 📱 Responsive Design

The website is built with a mobile-first approach and includes:

- Responsive navigation with mobile menu
- Adaptive grid layouts for different screen sizes
- Touch-friendly interactive elements
- Optimized typography scaling

## 🔧 Customization

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route to `src/App.jsx`
3. Add navigation links to `src/components/Header.jsx`
4. Include translations in `src/utils/translations.js`

### Modifying Styles

- Global styles: Edit `src/index.css`
- Component styles: Use Tailwind classes or add custom CSS
- Design tokens: Modify `tailwind.config.js`

### Adding Translations

1. Add new text keys to `src/utils/translations.js`
2. Use the `useLanguage` hook in components
3. Access translations via `t.keyName`

## 📄 Available Pages

- **Homepage**: Complete landing page with all sections
- **Packages**: Fitness package selection (placeholder)
- **Training Programs**: Workout programs (placeholder)
- **Transformations**: Success stories (placeholder)
- **Store**: Fitness equipment and supplements (placeholder)
- **Partners**: Business partnerships (placeholder)
- **Contact**: Contact information and form (placeholder)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, please contact:
- Email: info@gymmawy.net
- Phone: 0020106520190

## 🎯 Roadmap

- [ ] Implement actual images and icons from assets folder
- [ ] Add interactive features (forms, modals, etc.)
- [ ] Implement backend integration
- [ ] Add animations and transitions
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Testing suite
- [ ] CI/CD pipeline
