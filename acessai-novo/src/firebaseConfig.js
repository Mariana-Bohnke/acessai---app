import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- COLE AQUI O CÓDIGO DA TELA DO GOOGLE ---
// Copie apenas a parte do: const firebaseConfig = { ... };
// (Substitua este bloco de comentário pelo código que está na sua tela)
const firebaseConfig = {
  apiKey: "SUA_CHAVE_QUE_ESTA_NA_TELA",
  authDomain: "acessai-....firebaseapp.com",
  projectId: "acessai-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
// ---------------------------------------------

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Banco de Dados (Isso é o que o Google não mostra lá)
export const db = getFirestore(app);