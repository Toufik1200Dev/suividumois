import React, { useState, useEffect } from 'react';
import './ActivityTracker.css';
import { saveMonthlyData, getMonthlyData } from '../firebase/firestoreService';
import { getCurrentUser } from '../firebase/authService';

const ActivityTracker = ({ onLogout, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clientActivities, setClientActivities] = useState([{ client: '', activity: '' }]);
  const [absenceData, setAbsenceData] = useState({
    type: '',
    telework: '0',
    restaurantTicket: '0'
  });
  const [monthData, setMonthData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedDays, setSubmittedDays] = useState(0);

  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  const loadMonthData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const result = await getMonthlyData(user.uid, year, month);
      if (result.success) {
        setMonthData(result.data);
      }
    } catch (error) {
      // Error loading month data
    } finally {
      setIsLoading(false);
    }
  };

  const clientOptions = [
    'Bouygues', 'AFD', 'Orange', 'Free', 'SFR', 'Ericson', 'TDF', 'SNCF',
    'Autres clients France', 'ARCEP Burkina', 'Orange Sénégal', 'ARCEP Togo',
    'Togocell - YAS', 'Lillybelle Togo', 'ARTP Sénégal', 'Autres clients export'
  ];

  const activityOptions = [
    'Support de maintenance', 'Service projet', 'Avant-vente', 
    'Supply chain', 'Commercial', 'interne'
  ];

  const absenceTypes = ['Congés', 'Maladie', 'Récupération', 'Formation', 'Présent'];

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const addClientActivity = () => {
    setClientActivities([...clientActivities, { client: '', activity: '' }]);
  };

  const removeClientActivity = (index) => {
    if (clientActivities.length > 1) {
      setClientActivities(clientActivities.filter((_, i) => i !== index));
    }
  };

  const updateClientActivity = (index, field, value) => {
    const updated = [...clientActivities];
    updated[index][field] = value;
    setClientActivities(updated);
  };

  const handleAbsenceChange = (field, value) => {
    setAbsenceData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDaySelection = (day) => {
    if (day === null || day.isWeekend) return;
    
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    
    setSelectedDays(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
      } else {
        return [...prev, dateString];
      }
    });
  };

  const isDaySelected = (day) => {
    if (day === null || day.isWeekend) return false;
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    return selectedDays.includes(dateString);
  };

  const generateMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    const calendar = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push({ day: null, isWeekend: false, isToday: false });
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      const isToday = date.toDateString() === today.toDateString();
      
      // Use a more reliable date format that avoids timezone issues
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      calendar.push({
        day,
        isWeekend,
        isToday,
        date: dateString
      });
    }

    return calendar;
  };

  const calculateDayValue = (clientCount) => {
    if (clientCount === 0) return [];
    if (clientCount === 1) return [1];
    
    const value = 1 / clientCount;
    return Array(clientCount).fill(value);
  };

  const handleSubmit = async () => {
    // Validate selected days
    if (selectedDays.length === 0) {
      alert('Veuillez sélectionner au moins un jour dans le calendrier');
      return;
    }

    // Validate client activities
    const validActivities = clientActivities.filter(ca => ca.client && ca.activity);
    if (validActivities.length === 0) {
      alert('Veuillez sélectionner au moins un client et une activité');
      return;
    }

    // Validate absence data
    if (!absenceData.type) {
      alert('Veuillez sélectionner un type d\'absence');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        alert('Utilisateur non authentifié');
        return;
      }

      const dayValue = calculateDayValue(validActivities.length);
      const updatedMonthData = { ...monthData };
      
      // Update data for all selected days
      selectedDays.forEach(dateString => {
        updatedMonthData[dateString] = {
          activities: [...(monthData[dateString]?.activities || []), ...validActivities],
          absence: absenceData,
          dayValue: calculateDayValue([...(monthData[dateString]?.activities || []), ...validActivities].length)
        };
      });

      // Save to Firestore
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const result = await saveMonthlyData(user.uid, year, month, updatedMonthData);
      
      if (result.success) {
        setMonthData(updatedMonthData);
        
        // Show thank you message
        setSubmittedDays(selectedDays.length);
        setShowThankYou(true);
        
        // Reset form inputs and selected days
        setClientActivities([{ client: '', activity: '' }]);
        setAbsenceData({ type: '', telework: '0', restaurantTicket: '0' });
        setSelectedDays([]);
        
        // Hide thank you message after 4 seconds
        setTimeout(() => {
          setShowThankYou(false);
        }, 4000);
      } else {
        alert('Erreur lors de l\'enregistrement: ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors de l\'enregistrement des données');
    }
  };

  const getDayData = (date) => {
    return monthData[date] || null;
  };

  const calendar = generateMonthCalendar();

  return (
    <div className="activity-tracker">
      <header className="header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Suivi des Activités</h1>
            {user && (
              <p className="welcome-message">
                Bienvenue, {user.firstName || user.displayName || 'Utilisateur'} !
              </p>
            )}
          </div>
          <button onClick={onLogout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="month-navigation">
        <button onClick={() => navigateMonth('prev')} className="nav-btn">
          <span className="nav-arrow">←</span> Précédent
        </button>
        <h2 className="month-year">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={() => navigateMonth('suivant')} className="nav-btn">
          Suivant <span className="nav-arrow">→</span>
        </button>
      </div>

      {/* Monthly Calendar - Moved to top */}
      <div className="calendar-section">
        <h4>Calendrier du mois - Sélectionnez les jours</h4>
        <div className="calendar">
          <div className="calendar-header">
            {dayNames.map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {calendar.map((dayData, index) => (
              <div
                key={index}
                className={`calendar-day ${dayData.isWeekend ? 'weekend' : ''} ${dayData.isToday ? 'today' : ''} ${isDaySelected(dayData) ? 'selected' : ''}`}
                onClick={() => toggleDaySelection(dayData)}
              >
                {dayData.day && (
                  <>
                    <div className="day-number">{dayData.day}</div>
                    {!dayData.isWeekend && (
                      <>
                        <div className="day-separator"></div>
                        {getDayData(dayData.date) ? (
                          <div className="day-values">
                            {getDayData(dayData.date).dayValue.map((value, i) => (
                              <div key={i} className="value-item">
                                {value.toFixed(2)}
                              </div>
                            ))}
                            <div className="total-value">
                              {getDayData(dayData.date).dayValue.reduce((sum, val) => sum + val, 0).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="day-values">
                            <div className="value-item">0.00</div>
                            <div className="total-value">0.00</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        {selectedDays.length > 0 && (
          <div className="selected-days-info">
            <p>Jours sélectionnés: {selectedDays.length}</p>
            <button onClick={() => setSelectedDays([])} className="clear-selection-btn">
              Effacer la sélection
            </button>
          </div>
        )}
      </div>

      <div className="content">
        <h3 className="section-title">Temps Standards</h3>
        
        {/* Client/Activity Table */}
        <div className="table-section">
          <h4>Clients et Activités</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Activité</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientActivities.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.client}
                      onChange={(e) => updateClientActivity(index, 'client', e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {clientOptions.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.activity}
                      onChange={(e) => updateClientActivity(index, 'activity', e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">Sélectionner une activité</option>
                      {activityOptions.map(activity => (
                        <option key={activity} value={activity}>{activity}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {clientActivities.length > 1 && (
                      <button
                        onClick={() => removeClientActivity(index)}
                        className="remove-btn"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addClientActivity} className="add-btn">
            Ajouter une ligne
          </button>
        </div>

        {/* Absence/Telework/Restaurant Table */}
        <div className="table-section">
          <h4>Absences et Autres</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type d'absence</th>
                <th>Télétravail</th>
                <th>Ticket restaurant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <select
                    value={absenceData.type}
                    onChange={(e) => handleAbsenceChange('type', e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {absenceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={absenceData.telework}
                    onChange={(e) => handleAbsenceChange('telework', e.target.value)}
                    className="form-control"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </td>
                <td>
                  <select
                    value={absenceData.restaurantTicket}
                    onChange={(e) => handleAbsenceChange('restaurantTicket', e.target.value)}
                    className="form-control"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button onClick={handleSubmit} className="submit-btn">
          Soumettre pour {selectedDays.length} jour(s) sélectionné(s)
        </button>
      </div>

      {/* Thank You Message */}
      {showThankYou && (
        <div className="thank-you-overlay">
          <div className="thank-you-modal">
            <div className="thank-you-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            <h2 className="thank-you-title">Merci !</h2>
            <p className="thank-you-message">
              Vos données ont été enregistrées avec succès pour <strong>{submittedDays} jour(s)</strong>.
            </p>
            <div className="thank-you-details">
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <span>{submittedDays} jour(s) mis à jour</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">💾</span>
                <span>Données sauvegardées</span>
              </div>
            </div>
            <div className="thank-you-footer">
              <p>Continuez votre excellent travail !</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;
