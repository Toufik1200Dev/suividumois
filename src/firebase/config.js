// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvTteMbM28eS42crqv2XAREWDNW5JNY3w",
  authDomain: "lillybelle-activity-suivi.firebaseapp.com",
  projectId: "lillybelle-activity-suivi",
  storageBucket: "lillybelle-activity-suivi.firebasestorage.app",
  messagingSenderId: "900260952535",
  appId: "1:900260952535:web:9d506ed2e1d52cb835f392",
  measurementId: "G-XBPQT0HYXL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
