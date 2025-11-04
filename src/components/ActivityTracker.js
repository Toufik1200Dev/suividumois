import React, { useState, useEffect } from 'react';
import './ActivityTracker.css';
import { saveMonthlyData, getMonthlyData } from '../firebase/firestoreService';
import { getCurrentUser } from '../firebase/authService';

const ActivityTracker = ({ onLogout, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekRows, setWeekRows] = useState([{
    client: '',
    activity: '',
    timeType: 'present', // 'present' or 'absent'
    days: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    }
  }]);
  const [weekData, setWeekData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [teleworkData, setTeleworkData] = useState({
    monday: '0',
    tuesday: '0',
    wednesday: '0',
    thursday: '0',
    friday: '0',
    saturday: '0',
    sunday: '0'
  });
  const [restaurantTicketData, setRestaurantTicketData] = useState({
    monday: '0',
    tuesday: '0',
    wednesday: '0',
    thursday: '0',
    friday: '0',
    saturday: '0',
    sunday: '0'
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadWeekData();
  }, [currentDate]);

  // Get week start (Monday) and end (Sunday) dates
  const getWeekStartEnd = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  // Get week number of the year
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const loadWeekData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { monday, sunday } = getWeekStartEnd(currentDate);
      const year = monday.getFullYear();
      const month = monday.getMonth();
      
      const result = await getMonthlyData(user.uid, year, month);
      if (result.success) {
        // Filter data for current week
        const weekDataFiltered = {};
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const teleworkTemp = { monday: '0', tuesday: '0', wednesday: '0', thursday: '0', friday: '0', saturday: '0', sunday: '0' };
        const restaurantTemp = { monday: '0', tuesday: '0', wednesday: '0', thursday: '0', friday: '0', saturday: '0', sunday: '0' };
        
        // Create weekDays array for this week
        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const weekDaysArray = dayNames.map((name, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          return {
            name,
            date,
            dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          };
        });
        
        Object.keys(result.data).forEach(dateString => {
          const date = new Date(dateString + 'T00:00:00');
          if (date >= monday && date <= sunday) {
            weekDataFiltered[dateString] = result.data[dateString];
            // Load telework and restaurant ticket data
            const dayIndex = weekDaysArray.findIndex(day => day.dateString === dateString);
            if (dayIndex >= 0 && dayIndex < dayKeys.length) {
              const dayKey = dayKeys[dayIndex];
              if (result.data[dateString].absence) {
                teleworkTemp[dayKey] = result.data[dateString].absence.telework || '0';
                restaurantTemp[dayKey] = result.data[dateString].absence.restaurantTicket || '0';
              }
            }
          }
        });
        setWeekData(weekDataFiltered);
        setTeleworkData(teleworkTemp);
        setRestaurantTicketData(restaurantTemp);
        
        // Load saved data into form if it exists
        loadSavedDataIntoForm(weekDataFiltered);
      }
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved data into the form for editing
  const loadSavedDataIntoForm = (data) => {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const { monday } = getWeekStartEnd(currentDate);
    
    // Create weekDays array
    const weekDaysArray = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        date,
        dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      };
    });
    
    // Group activities by client+activity combination
    const activityMap = new Map();
    
    dayKeys.forEach((dayKey, dayIndex) => {
      const dateString = weekDaysArray[dayIndex].dateString;
      const dayData = data[dateString];
      
      if (dayData && dayData.activities && dayData.activities.length > 0) {
        dayData.activities.forEach(activity => {
          const key = `${activity.client}|${activity.activity}`;
          if (!activityMap.has(key)) {
            activityMap.set(key, {
              client: activity.client,
              activity: activity.activity,
              timeType: dayData.absence?.type === 'Absent' ? 'absent' : 'present',
              days: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' }
            });
          }
          if (activity.value) {
            activityMap.get(key).days[dayKey] = activity.value.toString();
          }
        });
      }
    });
    
    const loadedRows = Array.from(activityMap.values());
    
    // Only load if there's data and form is empty
    if (loadedRows.length > 0 && weekRows.length === 1 && !weekRows[0].client) {
      setWeekRows(loadedRows);
      setIsEditing(true);
    }
  };

  // Function to load saved data into form (called from Edit button)
  const loadSavedDataForEditing = () => {
    const savedRows = getSavedDataForDisplay();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const { monday } = getWeekStartEnd(currentDate);
    
    const weekDaysArray = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        date,
        dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      };
    });
    
    // Convert saved data back to form format
    const formRows = [];
    savedRows.forEach(savedRow => {
      const row = {
        client: savedRow.client,
        activity: savedRow.activity,
        timeType: 'present',
        days: { ...savedRow.days }
      };
      formRows.push(row);
    });
    
    setWeekRows(formRows);
    setIsEditing(true);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clientOptions = [
    'Bouygues', 'AFD', 'Orange', 'Free', 'SFR', 'Ericson', 'TDF', 'SNCF',
    'Autres clients France', 'ARCEP Burkina', 'Orange Sénégal', 'ARCEP Togo',
    'Togocell - YAS', 'Lillybelle Togo', 'ARTP Sénégal', 'Autres clients export', 'interne'
  ];

  const activityOptions = [
    'Support de maintenance', 'Service projet', 'Avant-vente', 
    'Supply chain', 'Commercial', 'interne'
  ];

  const absenceActivityOptions = ['congés', 'maladie', 'récupération', 'formation'];

  const { monday, sunday } = getWeekStartEnd(currentDate);
  const weekNumber = getWeekNumber(currentDate);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Get dates for each day of the week
  const weekDays = dayNames.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      name,
      date,
      dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    };
  });

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const addRow = () => {
    setWeekRows([...weekRows, {
      client: '',
      activity: '',
      timeType: 'present',
      days: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    }]);
  };

  const removeRow = (index) => {
    if (weekRows.length > 1) {
      setWeekRows(weekRows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index, field, value) => {
    const updated = [...weekRows];
    if (field === 'timeType') {
      updated[index][field] = value;
      // If changed to absent, set default client to 'interne'
      if (value === 'absent') {
        updated[index].client = 'interne';
        updated[index].activity = '';
      }
    } else {
      updated[index][field] = value;
    }
    setWeekRows(updated);
  };

  const updateDayValue = (rowIndex, dayKey, value) => {
    // Validate value is between 0.1 and 1
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0.1 && numValue <= 1)) {
      const updated = [...weekRows];
      updated[rowIndex].days[dayKey] = value;
      setWeekRows(updated);
    }
  };

  // Validate that sum of each day across all present rows equals 1
  const validateDayTotals = () => {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const errors = [];
    
    dayKeys.forEach(dayKey => {
      // Only validate totals for present rows (absent rows don't have day values)
      const total = weekRows.reduce((sum, row) => {
        if (row.timeType === 'present') {
          const value = parseFloat(row.days[dayKey]) || 0;
          return sum + value;
        }
        return sum;
      }, 0);
      
      // Only validate if there are any present rows with values for this day
      const hasPresentValues = weekRows.some(row => 
        row.timeType === 'present' && parseFloat(row.days[dayKey]) > 0
      );
      
      // Allow small floating point differences, but only validate if there are values
      if (hasPresentValues && total > 0 && Math.abs(total - 1) > 0.01) {
        errors.push(`${dayNames[dayKeys.indexOf(dayKey)]}: total should be 1, got ${total.toFixed(2)}`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async () => {
    // Validate all rows have client and activity
    const invalidRows = weekRows.filter(row => !row.client || !row.activity);
    if (invalidRows.length > 0) {
      alert('Veuillez remplir tous les champs Client et Activité');
      return;
    }

    // Validate time type
    const invalidTimeType = weekRows.filter(row => !row.timeType);
    if (invalidTimeType.length > 0) {
      alert('Veuillez sélectionner le Type de temps pour toutes les lignes');
      return;
    }

    // Validate day totals
    const dayErrors = validateDayTotals();
    if (dayErrors.length > 0) {
      alert('Erreurs de validation:\n' + dayErrors.join('\n') + '\n\nLa somme de chaque jour doit être égale à 1.');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        alert('Utilisateur non authentifié');
        return;
      }

      const updatedWeekData = { ...weekData };
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Initialize all days of the week with telework and restaurant ticket data
      // IMPORTANT: Replace activities instead of appending to avoid accumulation
      dayKeys.forEach((dayKey, dayIndex) => {
        const dateString = weekDays[dayIndex].dateString;
        // Reset activities array for each day - new submission replaces old data
        updatedWeekData[dateString] = {
          activities: [],
          absence: {
            type: 'Présent',
            telework: teleworkData[dayKey] || '0',
            restaurantTicket: restaurantTicketData[dayKey] || '0'
          }
        };
      });
      
      // Process each row - collect all activities for each day
      const activitiesByDay = {};
      dayKeys.forEach((dayKey, dayIndex) => {
        activitiesByDay[weekDays[dayIndex].dateString] = [];
      });
      
      weekRows.forEach(row => {
        dayKeys.forEach((dayKey, dayIndex) => {
          const dayValue = parseFloat(row.days[dayKey]) || 0;
          
          if (dayValue > 0) {
            const dateString = weekDays[dayIndex].dateString;
            
            // Determine absence type - if any row for this day is absent, mark as absent
            if (row.timeType === 'absent') {
              updatedWeekData[dateString].absence.type = 'Absent';
            }

            // Collect activity entry with the day value
            activitiesByDay[dateString].push({
              client: row.client,
              activity: row.activity,
              value: dayValue
            });
          }
        });
      });
      
      // Set all activities for each day (replacing previous data)
      dayKeys.forEach((dayKey, dayIndex) => {
        const dateString = weekDays[dayIndex].dateString;
        updatedWeekData[dateString].activities = activitiesByDay[dateString];
        
        // If no activities and no absence type set, keep as Présent
        if (updatedWeekData[dateString].activities.length === 0) {
          updatedWeekData[dateString].absence.type = 'Présent';
        }
      });

      // Save to Firestore - save for the month containing the week
      const year = monday.getFullYear();
      const month = monday.getMonth();
      const result = await saveMonthlyData(user.uid, year, month, updatedWeekData);
      
      if (result.success) {
        setWeekData(updatedWeekData);
        setShowThankYou(true);
        
        // Reset form
        setWeekRows([{
          client: '',
          activity: '',
          timeType: 'present',
          days: {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
          }
        }]);
        setTeleworkData({ monday: '0', tuesday: '0', wednesday: '0', thursday: '0', friday: '0', saturday: '0', sunday: '0' });
        setRestaurantTicketData({ monday: '0', tuesday: '0', wednesday: '0', thursday: '0', friday: '0', saturday: '0', sunday: '0' });
        setIsEditing(false);
        
        // Reload week data to show updated table
        await loadWeekData();
        
        setTimeout(() => {
          setShowThankYou(false);
        }, 4000);
      } else {
        alert('Erreur lors de l\'enregistrement: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Erreur lors de l\'enregistrement des données');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  // Process saved data for display
  const getSavedDataForDisplay = () => {
    const savedRows = [];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Group activities by client and activity combination
    const activityMap = new Map();
    
    dayKeys.forEach((dayKey, dayIndex) => {
      const dateString = weekDays[dayIndex].dateString;
      const dayData = weekData[dateString];
      
      if (dayData && dayData.activities && dayData.activities.length > 0) {
        dayData.activities.forEach(activity => {
          const key = `${activity.client}|${activity.activity}`;
          if (!activityMap.has(key)) {
            activityMap.set(key, {
              client: activity.client,
              activity: activity.activity,
              days: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' }
            });
          }
          activityMap.get(key).days[dayKey] = activity.value ? activity.value.toString() : '';
        });
      }
    });
    
    return Array.from(activityMap.values());
  };

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

      <div className="week-navigation">
        <button onClick={() => navigateWeek('prev')} className="nav-btn">
          <span className="nav-arrow">←</span> Précédent
        </button>
        <h2 className="week-info">
          Semaine {weekNumber} - {formatDate(monday)} au {formatDate(sunday)} {currentDate.getFullYear()}
        </h2>
        <button onClick={() => navigateWeek('next')} className="nav-btn">
          Suivant <span className="nav-arrow">→</span>
        </button>
      </div>

      <div className="content">
        {isEditing && (
          <div className="editing-indicator">
            <span className="editing-icon">✏️</span>
            <span>Mode édition - Les nouvelles données remplaceront les données existantes</span>
            <button onClick={() => {
              setWeekRows([{
                client: '',
                activity: '',
                timeType: 'present',
                days: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' }
              }]);
              setIsEditing(false);
            }} className="cancel-edit-btn">
              Annuler
            </button>
          </div>
        )}
        <div className="weekly-table-container">
          <table className="weekly-table">
            <thead>
              <tr>
                <th className="add-row-header">
                  <button onClick={addRow} className="add-row-btn">+</button>
                </th>
                <th>Client</th>
                <th>Activité</th>
                <th>Type de temps</th>
                {weekDays.map(day => (
                  <th key={day.dateString} className="day-header">
                    <div className="day-header-name">{day.name}</div>
                    <div className="day-header-date">{formatDate(day.date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="action-cell">
                    {weekRows.length > 1 && (
                      <button onClick={() => removeRow(rowIndex)} className="remove-row-btn">
                        ×
                      </button>
                    )}
                  </td>
                  <td>
                    <select
                      value={row.client}
                      onChange={(e) => updateRow(rowIndex, 'client', e.target.value)}
                      className="form-control"
                      disabled={row.timeType === 'absent'}
                    >
                      <option value="">Sélectionner</option>
                      {clientOptions.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.activity}
                      onChange={(e) => updateRow(rowIndex, 'activity', e.target.value)}
                      className="form-control"
                    >
                      <option value="">Sélectionner</option>
                      {(row.timeType === 'absent' ? absenceActivityOptions : activityOptions).map(activity => (
                        <option key={activity} value={activity}>{activity}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.timeType}
                      onChange={(e) => updateRow(rowIndex, 'timeType', e.target.value)}
                      className="form-control"
                    >
                      <option value="present">Présent</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, dayIndex) => (
                    <td key={dayKey} className="day-input-cell">
                      <input
                        type="number"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={row.days[dayKey]}
                        onChange={(e) => updateDayValue(rowIndex, dayKey, e.target.value)}
                        className="day-input"
                        placeholder="0.0"
                        disabled={row.timeType === 'absent'}
                      />
                      {row.days[dayKey] && (
                        <div className="day-value-display">{parseFloat(row.days[dayKey]).toFixed(1)}</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="4" className="total-label">Total par jour:</td>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, dayIndex) => {
                  const total = weekRows.reduce((sum, row) => {
                    // Only count present rows in total
                    if (row.timeType === 'present') {
                      return sum + (parseFloat(row.days[dayKey]) || 0);
                    }
                    return sum;
                  }, 0);
                  const hasPresentRows = weekRows.some(row => 
                    row.timeType === 'present' && parseFloat(row.days[dayKey]) > 0
                  );
                  return (
                    <td key={dayKey} className="total-cell">
                      {hasPresentRows ? (
                        <div className={`total-value ${Math.abs(total - 1) < 0.01 && total > 0 ? 'valid' : 'invalid'}`}>
                          {total.toFixed(2)}
                        </div>
                      ) : (
                        <div className="total-value">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Third Table - Télétravail and Ticket Restaurant */}
        <div className="weekly-table-container">
          <h4 className="table-section-title">Télétravail et Ticket Restaurant</h4>
          <table className="weekly-table">
            <thead>
              <tr>
                <th></th>
                {weekDays.map(day => (
                  <th key={day.dateString} className="day-header">
                    <div className="day-header-name">{day.name}</div>
                    <div className="day-header-date">{formatDate(day.date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="label-cell">Télétravail</td>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, dayIndex) => (
                  <td key={dayKey} className="day-input-cell">
                    <select
                      value={teleworkData[dayKey]}
                      onChange={(e) => setTeleworkData({ ...teleworkData, [dayKey]: e.target.value })}
                      className="form-control"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="label-cell">Ticket Restaurant</td>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey, dayIndex) => (
                  <td key={dayKey} className="day-input-cell">
                    <select
                      value={restaurantTicketData[dayKey]}
                      onChange={(e) => setRestaurantTicketData({ ...restaurantTicketData, [dayKey]: e.target.value })}
                      className="form-control"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button onClick={handleSubmit} className="submit-btn">
          Soumettre
        </button>

        {/* Saved Data Display Table */}
        {getSavedDataForDisplay().length > 0 && (
          <div className="weekly-table-container saved-data-container">
            <div className="saved-data-header">
              <h4 className="table-section-title">Données enregistrées pour cette semaine</h4>
              <button 
                onClick={loadSavedDataForEditing}
                className="edit-saved-btn"
              >
                ✏️ Modifier
              </button>
            </div>
            <table className="weekly-table saved-data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Activité</th>
                  {weekDays.map(day => (
                    <th key={day.dateString} className="day-header">
                      <div className="day-header-name">{day.name}</div>
                      <div className="day-header-date">{formatDate(day.date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getSavedDataForDisplay().map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{row.client}</td>
                    <td>{row.activity}</td>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey) => (
                      <td key={dayKey} className="day-input-cell">
                        {row.days[dayKey] ? (
                          <div className="saved-value">{parseFloat(row.days[dayKey]).toFixed(1)}</div>
                        ) : (
                          <div className="saved-value-empty">-</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="2" className="total-label">Total par jour:</td>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey) => {
                    const savedRowsData = getSavedDataForDisplay();
                    const total = savedRowsData.reduce((sum, row) => {
                      return sum + (parseFloat(row.days[dayKey]) || 0);
                    }, 0);
                    return (
                      <td key={dayKey} className="total-cell">
                        {total > 0 ? (
                          <div className={`total-value ${Math.abs(total - 1) < 0.01 ? 'valid' : 'invalid'}`}>
                            {total.toFixed(2)}
                          </div>
                        ) : (
                          <div className="total-value">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
              Vos données ont été enregistrées avec succès.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;
