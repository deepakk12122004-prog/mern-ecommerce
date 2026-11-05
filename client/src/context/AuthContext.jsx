import { createContext, useContext, useEffect, useState } from "react"; 
import { 
loginUser, 
registerUser, 
logoutUser, 
getCurrentUser, 
updateUserName, 
} from "../api/authService"; 
import { setUnauthorizedHandler } from "../api/axios"; 
const AuthContext = createContext(null); 
export function AuthProvider({ children }) { 
// The user lives in memory only. The login cookie (which JavaScript 
// cannot read) is the real proof of login, so after a refresh we ask 
  // the server who we are. 
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); // true until the first check ends 
 
  useEffect(() => { 
    const controller = new AbortController(); 
    let cancelled = false; 
 
    // The old mock login saved a fake user here. Remove the leftover. 
    try { 
      localStorage.removeItem("mockUser"); 
    } catch { 
      /* storage unavailable: ignore */ 
    } 
 
    getCurrentUser(controller.signal) 
      .then((currentUser) => { 
        if (!cancelled) setUser(currentUser); 
      }) 
      .catch(() => { 
        // 401 (not logged in), server down, etc. All mean "no user". 
        if (!cancelled) setUser(null); 
      }) 
      .finally(() => { 
        if (!cancelled) setLoading(false); 
      }); 
 
    return () => { 
      cancelled = true; 
      controller.abort(); 
    }; 
  }, []); 
 
  // If the session ends while the app is open, log out in the UI too. 
  useEffect(() => { 
    setUnauthorizedHandler(() => setUser(null)); 
    return () => setUnauthorizedHandler(null); 
  }, []); 
 
  const login = async (email, password) => { 
    setUser(await loginUser(email, password)); 
  }; 
 
  const register = async (name, email, password) => { 
    setUser(await registerUser(name, email, password)); 
  }; 
 
  const logout = async () => { 
    try { 
      await logoutUser(); 
    } catch { 
      // Even if the request failed, clear the screen state. 
    } 
    setUser(null); 
  }; 
 
  const updateProfile = async (name) => { 
    setUser(await updateUserName(user, name)); 
  }; 
 
  const value = { user, loading, login, register, logout, updateProfile }; 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; 
} 
 
// eslint-disable-next-line react-refresh/only-export-components 
export function useAuth() { 
  const context = useContext(AuthContext); 
  if (!context) throw new Error("useAuth must be used inside AuthProvider"); 
  return context; 
} 
 
