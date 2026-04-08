// firebase.js — pega tu firebaseConfig aquí
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZKUzp5wgkFZWaho1kHB5YCnRiaahfVFk",
  authDomain: "comunication-navarro.firebaseapp.com",
  projectId: "comunication-navarro",
  storageBucket: "comunication-navarro.firebasestorage.app",
  messagingSenderId: "658525913017",
  appId: "1:658525913017:web:23b1d1fa6d35b59c6d0068"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
