import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCjfDeEyT2z0OKBmXpZWH9IlpU4-5dx86o",
  authDomain: "christisking-92eae.firebaseapp.com",
  projectId: "christisking-92eae",
  storageBucket: "christisking-92eae.firebasestorage.app",
  messagingSenderId: "454404922856",
  appId: "1:454404922856:web:0400a0ad32381f73a9185d"
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

export const authWithGoogle = async () => {

    let user = null;

    await signInWithPopup(auth, provider)
    .then((result) => {
        user = result.user
    })
    .catch((e) => {
        console.log(e)
    })

    return user;

}