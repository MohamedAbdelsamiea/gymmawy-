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

## 🌐 Expose to Internet with Local Tunnel

To make your app accessible worldwide:

1. **Install local tunnel**:
   ```bash
   npm install -g localtunnel
   ```

2. **Start your services** (follow steps above)

3. **Create tunnels**:
   ```bash
   # Backend tunnel
   ./tunnel-backend.sh
   
   # Frontend tunnel (new terminal)
   ./tunnel-frontend.sh
   ```

4. **Update environment**:
   ```bash
   ./update-tunnel-env.sh
   ```

5. **Restart services** and access via tunnel URLs!

**See [Local Tunnel Guide](LOCAL_TUNNEL_GUIDE.md) for detailed instructions.**

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
│   └── scripts/             # Migration and utility scripts
├── gymmawy-frontend/         # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
└── setup-env.sh            # Environment setup script
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
npm run migrate-to-render  # Run Render migration
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

1. Check the troubleshooting section
2. Review the documentation
3. Open an issue on GitHub

## 🙏 Acknowledgments

- [Prisma](https://prisma.io) for database management
- [React](https://reactjs.org) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Made with ❤️ for fitness enthusiasts**