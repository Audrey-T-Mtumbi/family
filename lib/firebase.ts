import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD_ykbSMnk5mXesRAbxx8C1_bsEFImwNGE",
  authDomain: "family-album-2aaa9.firebaseapp.com",
  projectId: "family-album-2aaa9",
  storageBucket: "family-album-2aaa9.firebasestorage.app",
  messagingSenderId: "1067377096027",
  appId: "1:1067377096027:web:426096f83999dc0cfa967e"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app