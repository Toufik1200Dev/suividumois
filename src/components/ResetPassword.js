import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase/config';
import './LoginPage.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [oobCode, setOobCode] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Get the oobCode from URL parameters
    const code = searchParams.get('oobCode');
    const mode = searchParams.get('mode');
    
    if (!code || mode !== 'resetPassword') {
      setError('Invalid or missing reset link. Please request a new password reset.');
      setIsVerifying(false);
      return;
    }

    setOobCode(code);
    
    // Verify the code and get the email
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setEmail(email);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error('Error verifying code:', error);
        let errorMessage = 'Invalid or expired reset link. Please request a new password reset.';
        
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid password reset link. Please request a new one.';
        }
        
        setError(errorMessage);
        setIsVerifying(false);
      });
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // Success - redirect to login
      setTimeout(() => {
        navigate('/', { state: { message: 'Password reset successful! Please sign in with your new password.' } });
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      let errorMessage = 'An error occurred while resetting your password. Please try again.';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This password reset link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid password reset link. Please request a new one.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Verifying...</h1>
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Please wait while we verify your reset link.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Reset Password</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {email && (
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                Resetting password for: <strong>{email}</strong>
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">New Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm New Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="showNewPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="checkbox"
            />
            <label htmlFor="showNewPassword" className="checkbox-label">Show Password</label>
          </div>

          <button type="submit" className="signin-btn" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="login-links">
          <p className="signup-link">
            Remember your password? 
            <span className="link-text" onClick={() => navigate('/')}>
              {' '}Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
