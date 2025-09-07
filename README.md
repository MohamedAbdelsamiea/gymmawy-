# 🏋️‍♂️ Gymmawy - Fitness Platform

A comprehensive PERN (PostgreSQL, Express, React, Node.js) stack fitness platform with user management, programme purchases, subscriptions, and admin dashboard.

## ✨ Features

- **User Management**: Registration, authentication, profile management
- **Programme System**: Browse and purchase fitness programmes
- **Subscription Plans**: Monthly/yearly subscription options
- **Payment Integration**: Multiple payment methods support
- **Admin Dashboard**: Complete admin panel for managing users, programmes, and payments
- **Lead Management**: Contact form integration with lead tracking
- **Multi-language Support**: Internationalization with i18next
- **Responsive Design**: Mobile-first responsive UI

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gymmawy.git
   cd gymmawy
   ```

2. **Setup environment**
   ```bash
   ./setup-env.sh
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd gymmawy-backend
   npm install
   
   # Frontend
   cd ../gymmawy-frontend
   npm install
   ```

4. **Setup database**
   ```bash
   cd ../gymmawy-backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd gymmawy-backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd gymmawy-frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Admin Dashboard: http://localhost:5173/dashboard

## 🚀 Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Manual Railway Deployment

1. **Fork this repository**
2. **Connect to Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your forked repository

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

4. **Configure Environment Variables**
   - Go to your backend service settings
   - Add these variables:
     ```
     DATABASE_URL=<from PostgreSQL service>
     JWT_SECRET=<generate a secure secret>
     CORS_ORIGIN=<your frontend URL>
     NODE_ENV=production
     ```

5. **Deploy Frontend**
   - Add another service for frontend
   - Set root directory to `gymmawy-frontend`
   - Add environment variable:
     ```
     REACT_APP_API_URL=<your backend URL>
     ```

6. **Import Data (Optional)**
   - Use Railway's terminal feature
   - Run: `npm run import-data`

### Automated Deployment

```bash
# Run the deployment script
./deploy-to-railway.sh
```

## 📁 Project Structure

```
gymmawy/
├── gymmawy-backend/          # Express.js API server
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Server entry point
│   ├── prisma/              # Database schema and migrations
│   ├── scripts/             # Migration and utility scripts
│   └── railway.json         # Railway configuration
├── gymmawy-frontend/         # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── railway.json         # Railway configuration
├── railway.json             # Root Railway configuration
├── setup-env.sh            # Environment setup script
└── deploy-to-railway.sh    # Deployment script
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Zod** - Schema validation

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **i18next** - Internationalization
- **Lucide React** - Icons

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run export-data  # Export database data
npm run import-data  # Import database data
npm run migrate-to-railway  # Run Railway migration
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:
- **Users** - User accounts and profiles
- **Programmes** - Fitness programmes
- **ProgrammePurchases** - User programme purchases
- **Subscriptions** - User subscription plans
- **Payments** - Payment transactions
- **Leads** - Contact form submissions
- **Orders** - E-commerce orders

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5431/gymmawy
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)
2. Review the [troubleshooting section](RAILWAY_DEPLOYMENT_GUIDE.md#troubleshooting)
3. Open an issue on GitHub

## 🙏 Acknowledgments

- [Railway](https://railway.app) for hosting
- [Prisma](https://prisma.io) for database management
- [React](https://reactjs.org) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Made with ❤️ for fitness enthusiasts**
