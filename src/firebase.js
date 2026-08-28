import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// 院内共通アカウントで自動サインインする。
// 個人ごとのログイン画面は用意せず、書き込み(Firestore/Storage)だけを
// 認証必須にするための「裏側の」サインインとして使う。
// 実際の編集操作の可否は、アプリ内の6桁PINゲートで制御する。
const SHARED_EMAIL = import.meta.env.VITE_SHARED_ACCOUNT_EMAIL
const SHARED_PASSWORD = import.meta.env.VITE_SHARED_ACCOUNT_PASSWORD

export const authReady = (() => {
  if (!SHARED_EMAIL || !SHARED_PASSWORD) {
    console.warn(
      '共通アカウントの環境変数が未設定です。閲覧のみ利用可能で、追加・編集はできません。',
    )
    return Promise.resolve(null)
  }
  return signInWithEmailAndPassword(auth, SHARED_EMAIL, SHARED_PASSWORD).catch(
    (err) => {
      console.error('共通アカウントへの自動サインインに失敗しました', err)
      return null
    },
  )
})()
