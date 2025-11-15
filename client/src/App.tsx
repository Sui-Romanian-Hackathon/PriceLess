import type { FC } from 'react';
import { Routes, Route } from 'react-router-dom';

// Global Context
import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import AccessGate from './pages/AccessGate';
import Profile from './pages/Profile';
import ProductsPage from './pages/ProductsPage';
import { UserMarketProvider } from './context/UserMarketContext';


const App: FC = () => {
  return (
    <AuthProvider>
       <UserMarketProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Access Gate handles:
              1. If wallet is not connected -> redirect to home (handled internally)
              2. Role selection (User/Agent)
              3. Subscription/Staking payment (to gain access)
            */}
            <Route path="/access-gate" element={<AccessGate />} /> 
            
            {/* Profile is protected:
              If no access/not connected, it redirects to /access-gate (handled internally)
            */}
            <Route path="/profile" element={<Profile />} /> 
            
            {/* Products Page is restricted to users with active access */}
            <Route path="/products" element={<ProductsPage />} /> 
            
            <Route path="*" element={<div className="p-10 text-center text-xl font-bold">404 - Page Not Found</div>} />
          </Routes>
        </main>
        
        {/* Simple Footer */}
        <footer className="bg-gray-800 text-gray-400 text-center p-4 text-sm">
            PriceLess DApp &copy; 2025. All rights reserved.
        </footer>
        </div>
      </UserMarketProvider>
    </AuthProvider>
  );
};

export default App;