import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ActivityTracker from './components/ActivityTracker';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import { useState, useEffect } from 'react';
import { onAuthStateChange, signOutUser } from './firebase/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('employee');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
        if (user) {
          setIsAuthenticated(true);
          setUser(user);
          setUserRole(user.role || 'employee');
        } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('employee');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    // User is already authenticated by Firebase, just update state
    setIsAuthenticated(true);
    setUser(userData);
    setUserRole(userData.role || 'employee');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      // State will be updated by the auth state listener
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#20b2aa'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                (userRole === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                  <Navigate to="/suivi-des-activity" replace />
                ) : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
              <Route 
                path="/suivi-des-activity" 
                element={
                  isAuthenticated && userRole === 'employee' ? 
                    <ActivityTracker onLogout={handleLogout} user={user} /> : 
                    <Navigate to="/" replace />
                } 
              />
          <Route 
            path="/admin" 
            element={
              isAuthenticated && userRole === 'admin' ? 
                <AdminDashboard onLogout={handleLogout} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <ResetPassword />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
