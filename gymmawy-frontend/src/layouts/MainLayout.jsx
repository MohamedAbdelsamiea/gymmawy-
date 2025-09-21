import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isStorePage = location.pathname === '/store';
  const isShopAllPage = location.pathname === '/shop-all';
  const isProductPage = location.pathname.startsWith('/product/');
  const isCartPage = location.pathname === '/cart';

  return (
    <div className="flex flex-col min-h-screen bg-[#ebebeb]">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer backgroundColor={isStorePage || isShopAllPage || isProductPage || isCartPage ? 'bg-white' : 'bg-[#ebebeb]'} />
    </div>
  );
};

export default MainLayout;
