import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvdrDW0JUkDtbe8EWJovltr0rEsozhGEw",
  authDomain: "chat-project-e6d83.firebaseapp.com",
  projectId: "chat-project-e6d83",
  storageBucket: "chat-project-e6d83.firebasestorage.app",
  messagingSenderId: "1022327211726",
  appId: "1:1022327211726:web:e7bcfe8bf320823304329f",
  measurementId: "G-ZK93DHJNJ3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);