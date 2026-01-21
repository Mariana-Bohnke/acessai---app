import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAsK9Upo1aM5MclTSnLhxtaiBuz6IvbobA",
  authDomain: "acessai-31c57.firebaseapp.com",
  projectId: "acessai-31c57",
  storageBucket: "acessai-31c57.firebasestorage.app",
  messagingSenderId: "694662902303",
  appId: "1:694662902303:web:468eb7f4343bbaa7a25b2a"
};

// --- MANTENHA ESTAS LINHAS FINAIS ---
// Elas ligam o código do site com o seu aplicativo
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);