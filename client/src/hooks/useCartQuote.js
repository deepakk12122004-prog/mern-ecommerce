import { useState, useEffect, useCallback } from "react"; 
import { quoteCart } from "../api/cartService"; 
 
// Gets the server-verified version of the cart: 
// real prices, real stock, and trusted totals. 
//   items - the cart items from useCart() 
// Returns { quote, loading, error, reload } 
export default function useCartQuote(items) { 
  const [quote, setQuote] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
  const [reloadKey, setReloadKey] = useState(0); 
 
  // A text that changes only when ids or quantities change 
  const key = items.map((i) => `${i.productId}:${i.quantity}`).join(","); 
 
  useEffect(() => { 
    if (!key) { 
      setQuote(null); 
      setError(""); 
      setLoading(false); 
      return undefined; 
    } 
 
    let cancelled = false; 
    const controller = new AbortController(); 
    setLoading(true); 
    setError(""); 
 
    // Wait a moment, so quick clicks on + and - send ONE request 
    const timer = setTimeout(() => { 
      quoteCart(items, controller.signal) 
        .then((result) => { 
          if (!cancelled) setQuote(result); 
        }) 
        .catch((err) => { 
          if (!cancelled) setError(err.message || "Could not check prices."); 
        }) 
        .finally(() => { 
          if (!cancelled) setLoading(false); 
        }); 
    }, 250); 
 
    return () => { 
      cancelled = true; 
      clearTimeout(timer); 
      controller.abort(); 
    }; 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [key, reloadKey]); 
 
  const reload = useCallback(() => setReloadKey((k) => k + 1), []); 
 
  return { quote, loading, error, reload }; 
} 
 
