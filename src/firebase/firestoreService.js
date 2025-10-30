import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';

// Save monthly activity data
export const saveMonthlyData = async (userId, year, month, data) => {
  try {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const docRef = doc(db, 'monthlyData', `${userId}_${monthId}`);
    
    await setDoc(docRef, {
      userId: userId,
      year: year,
      month: month,
      data: data,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving monthly data:', error);
    return { success: false, error: error.message };
  }
};

// Get monthly activity data
export const getMonthlyData = async (userId, year, month) => {
  try {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const docRef = doc(db, 'monthlyData', `${userId}_${monthId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: docSnap.data().data || {}
      };
    } else {
      return {
        success: true,
        data: {}
      };
    }
  } catch (error) {
    console.error('Error getting monthly data:', error);
    return { success: false, error: error.message };
  }
};

// Get all employees (for admin dashboard)
export const getAllEmployees = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'employee'));
    const querySnapshot = await getDocs(q);
    
    const employees = [];
    querySnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      employees: employees
    };
  } catch (error) {
    console.error('Error getting employees:', error);
    return { success: false, error: error.message };
  }
};

// Get all users (for admin dashboard)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      users: users
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: error.message };
  }
};

// Update user status
export const updateUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: isActive,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
    return { success: false, error: error.message };
  }
};

// Export user data to CSV format
export const exportUserData = async (userId, year, month) => {
  try {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const docRef = doc(db, 'monthlyData', `${userId}_${monthId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        data: data
      };
    } else {
      return {
        success: true,
        data: null
      };
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error.message };
  }
};
