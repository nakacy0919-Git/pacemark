import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBPzCNoGwXtxgIoyvM-xxoYqiR0_UYLphg",
  authDomain: "pacemark-4a279.firebaseapp.com",
  databaseURL: "https://pacemark-4a279-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pacemark-4a279",
  storageBucket: "pacemark-4a279.firebasestorage.app",
  messagingSenderId: "990483866016",
  appId: "1:990483866016:web:af9bb3e0f3408323ad04c5"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Realtime Databaseの機能をエクスポート（他のファイルで使えるようにする）
export const db = getDatabase(app);