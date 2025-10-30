import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Hash password using a simple hash function (in production, use bcrypt or similar)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Register a new user
export const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, position } = userData;
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Hash the password for storage
    const hashedPassword = await hashPassword(password);
    
    // Update user profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });
    
    // All users are created as employees by default
    const role = 'employee';
    
    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      position: position,
      role: role,
      hashedPassword: hashedPassword, // Store hashed password
      createdAt: new Date(),
      isActive: true
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Parse Firebase error codes and return user-friendly messages
    let errorMessage = 'An error occurred during registration. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or try to sign in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Remove "Firebase: " prefix and clean up the message
          errorMessage = error.message.replace(/^Firebase:\s*/i, '');
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData?.role || 'employee',
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        position: userData?.position
      }
    };
  } catch (error) {
    console.error('Sign in error:', error);
    
    // Parse Firebase error codes and return user-friendly messages
    let errorMessage = 'An error occurred during sign in. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          // Remove "Firebase: " prefix and clean up the message
          errorMessage = error.message.replace(/^Firebase:\s*/i, '');
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user data from Firestore to get the role
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Create user object with role information
        const userWithRole = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: userData?.role || 'employee',
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          position: userData?.position
        };
        
        callback(userWithRole);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to basic user data
        const userWithRole = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'employee'
        };
        callback(userWithRole);
      }
    } else {
      callback(null);
    }
  });
};

// Get current user with role information
export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData?.role || 'employee',
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        position: userData?.position
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'employee'
      };
    }
  }
  return null;
};

// Send password reset email
export const sendPasswordReset = async (email) => {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/reset-password',
      handleCodeInApp: true
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    return {
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    let errorMessage = 'Erreur lors de l\'envoi de l\'email de réinitialisation';
    
    switch (error.code) {
      case 'auth/user-not-found':
        // For security, we show the same message as success to prevent user enumeration
        return {
          success: true,
          message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
        };
      case 'auth/invalid-email':
        errorMessage = 'Adresse email invalide';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
        break;
      default:
        errorMessage = error.message.replace(/^Firebase:\s*/i, '');
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
