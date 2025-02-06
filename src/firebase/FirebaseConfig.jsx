// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const apiKey = import.meta.env.VITE_APP_API_KEY
const authDomain = import.meta.env.VITE_APP_AUTH_DOMAIN
const projectId = import.meta.env.VITE_APP_PROJECT_ID
const storageBucket = import.meta.env.VITE_APP_STORAGE_BUCKET
const messagingSenderId = import.meta.env.VITE_APP_MESSAGE_SENDER_ID
const appId = import.meta.env.VITE_APP_APP_ID
const measurementId = import.meta.env.VITE_APP_MEASUREMENT_ID



const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);
export {
    app,
    auth,
    storage,
    firestore,
    firebaseConfig
};