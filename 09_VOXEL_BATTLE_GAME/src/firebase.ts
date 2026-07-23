import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

// ────────────────────────────────────────────────────────────────────────────
// Firebase の設定をここに貼り付けてください（手順は README.md の「オンライン対戦の
// セットアップ」を参照）。
//
// ⚠️ ここに入る apiKey / appId などは Firebase Web では「公開前提の識別子」であり、
//    秘密情報ではありません。public リポジトリにコミットして問題ありません。
//    実際のアクセス制御は Realtime Database の「セキュリティルール」で行います
//    （README.md にルール例を記載）。
//
// 未設定のままでも「ローカル対戦（同じPCの2タブ）」は動作します。
// ────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyArC5IKG6cLy3Q9zileABwK12mwKXcA3d4",
  authDomain: "madogiwa-tachinomi.firebaseapp.com",
  databaseURL: "https://madogiwa-tachinomi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "madogiwa-tachinomi",
  storageBucket: "madogiwa-tachinomi.firebasestorage.app",
  messagingSenderId: "102813032641",
  appId: "1:102813032641:web:7ebd068d309d4aa8bd7440",
  measurementId: "G-NCGNT8ETC3"
};

/** 設定がプレースホルダのままかどうかを判定する。 */
export function isFirebaseConfigured(): boolean {
  return (
    !firebaseConfig.apiKey.startsWith("PASTE") &&
    !firebaseConfig.databaseURL.includes("PASTE")
  );
}

let app: FirebaseApp | undefined;
let db: Database | undefined;

export function getDb(): Database {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebaseが未設定です。src/firebase.ts に firebaseConfig を貼り付けてください。",
    );
  }
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}
