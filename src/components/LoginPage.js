import React, { useState } from 'react';
import './LoginPage.css';
import { registerUser, signInUser, sendPasswordReset } from '../firebase/authService';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    position: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        // Sign up validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (!formData.firstName || !formData.lastName || !formData.position) {
          setError('Please fill in all required fields');
          setIsLoading(false);
          return;
        }
        
        // Register user with Firebase (always as employee)
        const result = await registerUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          position: formData.position
        });
        
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      } else {
        // Sign in with Firebase
        const result = await signInUser(formData.email, formData.password);
        
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsAnimating(true);
    setError(''); // Clear any existing errors
    setShowForgotPassword(false);
    setForgotPasswordMessage('');
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        position: ''
      });
      setShowPassword(false);
      setIsAnimating(false);
    }, 300);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Veuillez entrer votre adresse email');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const result = await sendPasswordReset(forgotPasswordEmail);
      if (result.success) {
        setForgotPasswordMessage(result.message);
        setForgotPasswordEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordMessage('');
        }, 3000);
      } else {
        setForgotPasswordMessage(result.error);
      }
    } catch (error) {
      setForgotPasswordMessage('Une erreur inattendue s\'est produite');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setForgotPasswordMessage('');
    setForgotPasswordEmail('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">{isSignUp ? 'Sign Up' : 'Login'}</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className={`form-container ${isAnimating ? 'animating' : ''}`}>
          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <>
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name:</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last Name:</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="position" className="form-label">Poste:</label>
                  <select
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Sélectionner un poste</option>
                    <option value="Responsable de bureau">Responsable de bureau</option>
                    <option value="Assistante Supply Chain et ADV">Assistante Supply Chain et ADV</option>
                    <option value="Assistant ADV et Finances">Assistant ADV et Finances</option>
                    <option value="Comptable, Assistante ADV et Supply Chain">Comptable, Assistante ADV et Supply Chain</option>
                    <option value="Chargé de marketing et communication">Chargé de marketing et communication</option>
                    <option value="Agent entretien">Agent entretien</option>
                    <option value="Chauffeur - coursier">Chauffeur - coursier</option>
                    <option value="Directeur Général">Directeur Général</option>
                    <option value="Directeur Général Adjoint">Directeur Général Adjoint</option>
                    <option value="Directrice Organisation et RH">Directrice Organisation et RH</option>
                    <option value="Direction Comptabilité et Finances">Direction Comptabilité et Finances</option>
                    <option value="Directeur Commercial Export">Directeur Commercial Export</option>
                    <option value="Directeur Commercial / Head of Sales">Directeur Commercial / Head of Sales</option>
                    <option value="Ingénieur Commercial">Ingénieur Commercial</option>
                    <option value="Chef des ventes France">Chef des ventes France</option>
                    <option value="Business Developer">Business Developer</option>
                    <option value="Technico-Commercial">Technico-Commercial</option>
                    <option value="Coordinatrice des Ventes">Coordinatrice des Ventes</option>
                    <option value="Directeur des Opérations">Directeur des Opérations</option>
                    <option value="Dessinateur et Superviseur de travaux">Dessinateur et Superviseur de travaux</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Stagiaire">Stagiaire</option>
                    <option value="Technicien Coordinatrice FTTX">Technicien Coordinatrice FTTX</option>
                    <option value="Superviseur Génie civil et magasin">Superviseur Génie civil et magasin</option>
                    <option value="Technicien Telecom">Technicien Telecom</option>
                    <option value="Alternant ingénieur Telecom">Alternant ingénieur Telecom</option>
                    <option value="Technicien Support">Technicien Support</option>
                    <option value="Ingénieur Telecom">Ingénieur Telecom</option>
                    <option value="Technicien de mesures confirmé">Technicien de mesures confirmé</option>
                    <option value="Ingénieur Radio Senior">Ingénieur Radio Senior</option>
                    <option value="Expert Outils et Développement">Expert Outils et Développement</option>
                    <option value="Technicien Telecom Post Traitement">Technicien Telecom Post Traitement</option>
                    <option value="Technicien Drive Test et Support Senior">Technicien Drive Test et Support Senior</option>
                    <option value="Chef projet drive test et Support technique">Chef projet drive test et Support technique</option>
                    <option value="Chef de projets">Chef de projets</option>
                    <option value="Chef de projet senior">Chef de projet senior</option>
                    <option value="Responsable Supply Chain">Responsable Supply Chain</option>
                    <option value="Gestionnaire Supply Chain">Gestionnaire Supply Chain</option>
                    <option value="Responsable Support Telecom, IT et développement">Responsable Support Telecom, IT et développement</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter password"
                required
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="checkbox"
              />
              <label htmlFor="showPassword" className="checkbox-label">Show Password</label>
            </div>

            <button type="submit" className="signin-btn" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isSignUp ? 'SIGN UP' : 'SIGN IN')}
            </button>
          </form>
        </div>

        <div className="login-links">
          {!isSignUp && (
            <p className="forgot-link">
              Forgot <span className="link-text" onClick={toggleForgotPassword}>Username / Password</span>?
            </p>
          )}
          <p className="signup-link">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
            <span className="link-text" onClick={toggleForm}>
              {isSignUp ? ' Sign in' : ' Sign up'}
            </span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="forgot-password-overlay">
          <div className="forgot-password-modal">
            <div className="forgot-password-header">
              <h2>Mot de passe oublié</h2>
              <button 
                className="close-btn" 
                onClick={toggleForgotPassword}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            
            <div className="forgot-password-content">
              <p className="forgot-password-description">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="forgotEmail" className="form-label">Email:</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="form-control"
                    placeholder="Entrez votre adresse email"
                    required
                  />
                </div>
                
                {forgotPasswordMessage && (
                  <div className={`forgot-password-message ${forgotPasswordMessage.includes('succès') ? 'success' : 'error'}`}>
                    {forgotPasswordMessage}
                  </div>
                )}
                
                <div className="forgot-password-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={toggleForgotPassword}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="reset-btn" 
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
