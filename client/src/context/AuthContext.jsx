import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

const AuthContext = createContext(null);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user details from our backend
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error("Failed to fetch user profile", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    
    // Sync with backend (creates user if they don't exist)
    const res = await api.post('/auth/sync', {
      name: result.user.displayName,
      email: result.user.email
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    const token = await userCredential.user.getIdToken();
    
    const res = await api.post('/auth/sync', {
      name: data.name,
      businessName: data.businessName,
      gstin: data.gstin,
      email: data.email
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
