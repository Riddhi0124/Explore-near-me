import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDp1KtOuAFy6Opeeo6pinmgDFEQ6mCYhg",
  authDomain: "explore-near-me-f9e31.firebaseapp.com",
  projectId: "explore-near-me-f9e31",
  storageBucket: "explore-near-me-f9e31.firebasestorage.app",
  messagingSenderId: "529081662008",
  appId: "1:529081662008:web:e8a84d47d7a648798dc4cd",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;