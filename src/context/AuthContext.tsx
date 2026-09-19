import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
} from 'firebase/auth';
import { User, UserRole } from '../types';
import {
  auth,
  googleProvider,
  getCalendarProvider,
  saveUserToFirestore,
  setGoogleAccessToken,
  getGoogleAccessToken,
  isUserAdmin,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PHONE,
  ADMIN_EMAIL,
} from '../firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: UserRole;
  isLoading: boolean;
  googleAccessToken: string | null;
  loginWithGoogle: () => Promise<User>;
  connectCalendar: () => Promise<string>;
  loginWithEmail: (email: string, name?: string, password?: string, isSignUp?: boolean) => Promise<User>;
  loginAsDemo: (role: 'admin' | 'traveler') => Promise<User>;
  logout: () => Promise<void>;
  authError: string | null;
}

const STORAGE_KEY = 'trip_planner_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleAccessToken, setAccessTokenState] = useState<string | null>(getGoogleAccessToken());

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userEmail = fbUser.email || '';
        // Strict exact email check for Super Admin: only hemanthkuamr17@gmail.com
        const isSuperAdmin = isUserAdmin(userEmail);
        const role: UserRole = isSuperAdmin ? 'super_admin' : 'user';
        const appUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || (isSuperAdmin ? 'Super Admin' : userEmail.split('@')[0] || 'Traveler'),
          email: userEmail,
          avatar:
            fbUser.photoURL ||
            (isSuperAdmin
              ? `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
              : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`),
          provider: fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
          role,
          isAdmin: isSuperAdmin,
          phone: isSuperAdmin ? SUPER_ADMIN_PHONE : undefined,
          status: 'active',
        };
        setUser(appUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
        // Non-blocking sync to Firestore
        saveUserToFirestore(appUser).catch((err) => {
          console.warn('Could not sync user profile to Firestore yet:', err);
        });
      } else {
        setGoogleAccessToken(null);
        setAccessTokenState(null);
        // Check if there was a local session or if signed out
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.email) {
              const isSuperAdmin = isUserAdmin(parsed.email);
              parsed.role = isSuperAdmin ? 'super_admin' : 'user';
              parsed.isAdmin = isSuperAdmin;
              if (isSuperAdmin && !parsed.phone) {
                parsed.phone = SUPER_ADMIN_PHONE;
              }
              setUser(parsed);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // Standard sign in without sensitive scopes - ensures any user can log in seamlessly
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setGoogleAccessToken(token);
        setAccessTokenState(token);
      }

      const fbUser = result.user;
      const userEmail = fbUser.email || '';
      const isSuperAdmin = isUserAdmin(userEmail);
      const role: UserRole = isSuperAdmin ? 'super_admin' : 'user';

      const appUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || (isSuperAdmin ? 'Super Admin' : userEmail.split('@')[0] || 'Traveler'),
        email: userEmail,
        avatar:
          fbUser.photoURL ||
          (isSuperAdmin
            ? `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
            : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`),
        provider: 'google',
        role,
        isAdmin: isSuperAdmin,
        phone: isSuperAdmin ? SUPER_ADMIN_PHONE : undefined,
        status: 'active',
      };
      setUser(appUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      
      // Sync user document asynchronously
      saveUserToFirestore(appUser).catch((err) => {
        console.warn('Background sync of user profile to Firestore:', err);
      });

      setIsLoading(false);
      return appUser;
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      setIsLoading(false);
      let errorMsg = 'Failed to authenticate with Google';
      if (error.code === 'auth/popup-blocked') {
        errorMsg = 'Pop-up was blocked by your browser. Please allow pop-ups for this site, or open the app in a new tab.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMsg = 'Another authentication window is already open.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
      throw error;
    }
  };

  /**
   * Explicitly connect or refresh Google Calendar authorization with dedicated Calendar provider
   */
  const connectCalendar = async (): Promise<string> => {
    const currentToken = getGoogleAccessToken();
    if (currentToken) {
      return currentToken;
    }

    try {
      // Use getCalendarProvider() which explicitly asks for calendar scopes on demand
      const result = await signInWithPopup(auth, getCalendarProvider());
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        throw new Error('Google Calendar access token was not returned. Please grant permissions.');
      }
      setGoogleAccessToken(token);
      setAccessTokenState(token);
      return token;
    } catch (error: any) {
      console.error('Connect Calendar Error:', error);
      let errorMsg = 'Failed to connect Google Calendar';
      if (error.code === 'auth/popup-blocked') {
        errorMsg = 'Pop-up was blocked. Please allow pop-ups or open the app in a new window.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Calendar authorization was cancelled.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  /**
   * Universal email & password authentication with real Firebase Auth integration
   */
  const loginWithEmail = async (
    email: string,
    name?: string,
    password?: string,
    isSignUp?: boolean
  ): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      let fbUser: FirebaseUser | null = null;
      const pwd = password || 'Traveler@2025!';

      try {
        if (isSignUp) {
          const cred = await createUserWithEmailAndPassword(auth, email, pwd);
          fbUser = cred.user;
        } else {
          const cred = await signInWithEmailAndPassword(auth, email, pwd);
          fbUser = cred.user;
        }
        if (name && fbUser) {
          await updateProfile(fbUser, { displayName: name });
        }
      } catch (authErr: any) {
        // If email-password method is not enabled in Firebase Console (e.g. auth/operation-not-allowed),
        // fallback to anonymous Firebase Auth session so that Firestore rules have a valid request.auth.uid!
        if (
          authErr.code === 'auth/operation-not-allowed' ||
          authErr.code === 'auth/configuration-not-found'
        ) {
          const anonCred = await signInAnonymously(auth);
          fbUser = anonCred.user;
          if (name || email) {
            await updateProfile(anonCred.user, { displayName: name || email.split('@')[0] });
          }
        } else {
          throw authErr;
        }
      }

      const userEmail = fbUser?.email || email;
      const isSuperAdmin = isUserAdmin(userEmail);
      const role: UserRole = isSuperAdmin ? 'super_admin' : 'user';
      const appUser: User = {
        id: fbUser?.uid || 'usr_' + Date.now(),
        name: name || fbUser?.displayName || (isSuperAdmin ? 'Super Admin' : email.split('@')[0] || 'Traveler'),
        email: userEmail,
        avatar: isSuperAdmin
          ? `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || 'traveler')}`,
        provider: 'email',
        role,
        isAdmin: isSuperAdmin,
        phone: isSuperAdmin ? SUPER_ADMIN_PHONE : undefined,
        status: 'active',
      };

      setUser(appUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      saveUserToFirestore(appUser).catch((err) => {
        console.warn('Could not sync email user to Firestore:', err);
      });

      setIsLoading(false);
      return appUser;
    } catch (error: any) {
      setIsLoading(false);
      let msg = error.message || 'Failed to sign in with email.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to Sign In.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please switch to Sign Up.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginAsDemo = async (roleType: 'admin' | 'traveler'): Promise<User> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      let fbUser: FirebaseUser | null = null;
      try {
        const anonCred = await signInAnonymously(auth);
        fbUser = anonCred.user;
      } catch (err) {
        console.warn('Firebase anonymous auth fallback:', err);
      }

      const email = roleType === 'admin' ? SUPER_ADMIN_EMAIL : 'traveler.demo@example.com';
      const isSuperAdmin = isUserAdmin(email);
      const role: UserRole = isSuperAdmin ? 'super_admin' : 'user';
      const name = isSuperAdmin ? 'Super Admin' : 'Demo Traveler';
      const appUser: User = {
        id: fbUser?.uid || (isSuperAdmin ? 'super_admin_user' : 'traveler_demo_user'),
        name,
        email,
        avatar: isSuperAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        provider: 'demo',
        role,
        isAdmin: isSuperAdmin,
        phone: isSuperAdmin ? SUPER_ADMIN_PHONE : undefined,
        status: 'active',
      };

      setUser(appUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      saveUserToFirestore(appUser).catch((err) => {
        console.warn('Could not sync demo user to Firestore:', err);
      });

      setIsLoading(false);
      return appUser;
    } catch (error: any) {
      setIsLoading(false);
      const msg = error.message || 'Failed to start demo session.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setGoogleAccessToken(null);
    setAccessTokenState(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setFirebaseUser(null);
  };

  const isSuperAdmin = isUserAdmin(user?.email) || isUserAdmin(firebaseUser?.email);
  const currentRole: UserRole = isSuperAdmin ? 'super_admin' : 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isAdmin: isSuperAdmin,
        isSuperAdmin,
        role: currentRole,
        isLoading,
        googleAccessToken,
        loginWithGoogle,
        connectCalendar,
        loginWithEmail,
        loginAsDemo,
        logout,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
