import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { getDatabase, ref, set, push } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrkbzcX9nWSM__1jfERjofzsrKafpJtAc",
  authDomain: "utah-unchained.firebaseapp.com",
  databaseURL: "https://utah-unchained-default-rtdb.firebaseio.com",
  projectId: "utah-unchained",
  storageBucket: "utah-unchained.appspot.com",
  messagingSenderId: "35174915899",
  appId: "1:35174915899:web:b8e8cff50f3f7b5e19a11e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Set persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set successfully
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Firebase authentication functions
const createAccountWithEmailPassword = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

const signInWithEmailPassword = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

const storeJsonData = (jsonData: any) => {
  return push(ref(database, 'jsondata'), jsonData);
};

export {
  app,
  auth,
  createAccountWithEmailPassword,
  signInWithEmailPassword,
  storeJsonData,
  browserLocalPersistence,
  setPersistence,
  database,
  ref,
  set,
  push,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};
