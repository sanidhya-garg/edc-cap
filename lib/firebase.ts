import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Read Firebase config from environment variables (Next.js: process.env.NEXT_PUBLIC_*)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnEoWTlVz2EfuHHlxPr87S3Vt6fGpgm6A",
  authDomain: "edciitd-cap.firebaseapp.com",
  projectId: "edciitd-cap",
  storageBucket: "edciitd-cap.firebasestorage.app",
  messagingSenderId: "628375814887",
  appId: "1:628375814887:web:2bd623b0b2d03522b65842",
  measurementId: "G-4T3VFW3MVY"
};

// Initialize once (for SSR/Hot reload safety)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
