import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsEsZaJMJ5434V__BVCLNim8bb8c4h0eE",
  authDomain: "gemini-drive-fdc38.firebaseapp.com",
  projectId: "gemini-drive-fdc38",
  storageBucket: "gemini-drive-fdc38.appspot.com",
  messagingSenderId: "963177255804",
  appId: "1:963177255804:web:d80462e3ed4f78de8acaf9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
