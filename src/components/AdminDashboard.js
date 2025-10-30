import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { getAllUsers } from '../firebase/firestoreService';
import { exportAllEmployeesDataToCSV, downloadCSV } from '../firebase/exportService';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AdminDashboard = ({ onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const result = await getAllUsers();
      
      if (result.success) {
        setEmployees(result.users);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const createTestEmployees = async () => {
    try {
      const testEmployees = [
        {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          position: 'Développeur',
          role: 'employee',
          createdAt: new Date().toISOString()
        },
        {
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@example.com',
          position: 'Designer',
          role: 'employee',
          createdAt: new Date().toISOString()
        },
        {
          firstName: 'Pierre',
          lastName: 'Durand',
          email: 'pierre.durand@example.com',
          position: 'Manager',
          role: 'employee',
          createdAt: new Date().toISOString()
        }
      ];

      for (const employee of testEmployees) {
        const docRef = doc(collection(db, 'users'));
        await setDoc(docRef, employee);
      }

      alert('Employés de test créés avec succès!');
      loadEmployees(); // Reload the list
    } catch (error) {
      alert('Erreur lors de la création des employés de test: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setSuccessMessage('');
      
      const result = await exportAllEmployeesDataToCSV();
      
      if (result.success) {
        if (result.data.length === 0) {
          alert('Aucune donnée trouvée pour les employés');
          return;
        }
        
        const filename = `activites_employes_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(result.data, filename);
        
        setSuccessMessage('Données de tous les employés exportées avec succès');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Erreur lors de l\'export: ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#20b2aa' : '#dc3545';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Actif' : 'Inactif';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <div className="header-content">
            <h1>Tableau de Bord Administrateur</h1>
            <p style={{color: 'white', fontSize: '14px', margin: '5px 0 0 0'}}>
              Debug: Loading employees...
            </p>
          </div>
        </header>
        <div className="admin-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des employés...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
        <header className="admin-header">
          <div className="header-content">
            <h1>Tableau de Bord Administrateur</h1>
          <div className="header-actions">
            <button 
              onClick={handleExportCSV} 
              className="export-btn"
              disabled={isExporting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {isExporting ? 'Exportation...' : 'Exporter CSV'}
            </button>
            <button onClick={onLogout} className="logout-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{employees.length}</h3>
              <p>Total Utilisateurs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{employees.filter(emp => emp.role === 'employee').length}</h3>
              <p>Employés</p>
            </div>
          </div>
        </div>

        <div className="employees-section">
          <h2>Liste des Employés</h2>
          
          {employees.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <p>Aucun employé trouvé.</p>
              <p>Les employés apparaîtront ici une fois qu'ils se seront inscrits.</p>
              <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                <button onClick={loadEmployees} style={{padding: '10px 20px', backgroundColor: '#20b2aa', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
                  Recharger les employés
                </button>
                <button onClick={createTestEmployees} style={{padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
                  Créer des employés de test
                </button>
              </div>
            </div>
          ) : (
            <div className="employees-grid">
              {employees.map(employee => (
              <div key={employee.id} className="employee-card">
                <div className="card-header">
                  <div className="employee-avatar">
                    {(employee.firstName && employee.lastName) 
                      ? `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase()
                      : (() => {
                          const name = employee.displayName || employee.email || 'U';
                          return typeof name === 'string' ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
                        })()
                    }
                  </div>
                  <div className="employee-info">
                    <h3>{employee.firstName && employee.lastName 
                      ? `${employee.firstName} ${employee.lastName}` 
                      : employee.displayName || employee.email || 'Utilisateur'
                    }</h3>
                    <div className="employee-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: '#20b2aa' }}
                      >
                        Actif
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="personal-details">
                    <h4>Détails Personnels</h4>
                    <div className="detail-item">
                      <strong>Email:</strong> {employee.email || 'Non renseigné'}
                    </div>
                    <div className="detail-item">
                      <strong>Prénom:</strong> {employee.firstName || 'Non renseigné'}
                    </div>
                    <div className="detail-item">
                      <strong>Nom:</strong> {employee.lastName || 'Non renseigné'}
                    </div>
                    <div className="detail-item">
                      <strong>Poste:</strong> {employee.position || 'Non renseigné'}
                    </div>
                    <div className="detail-item">
                      <strong>Rôle:</strong> {employee.role || 'employee'}
                    </div>
                  </div>
                </div>
                
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
