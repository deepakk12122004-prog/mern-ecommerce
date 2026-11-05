import { createContext, useContext, useState, useEffect } from "react"; 
import { calculatePrices } from "../utils/pricing"; 
 
const CartContext = createContext(null); 
const STORAGE_KEY = "cart"; 
 
// Keep these in sync with the server (constants.js). 
const MAX_QUANTITY = 99; 
const MAX_LINES = 50; 
 
const OBJECT_ID = /^[0-9a-fA-F]{24}$/; 
 
// localStorage can be edited by anyone, so every saved line is 
// checked. Bad lines (including old mock ones like "p1") are dropped. 
function cleanItem(raw) { 
  if (!raw || typeof raw !== "object") return null; 
  const { productId, name, price, image, stock, quantity } = raw; 
 
  const valid = 
    typeof productId === "string" && 
    OBJECT_ID.test(productId) && 
    typeof name === "string" && 
    Number.isFinite(price) && 
    price >= 0 && 
    Number.isInteger(stock) && 
    stock >= 0 && 
    Number.isInteger(quantity) && 
    quantity >= 1; 
  if (!valid) return null; 
 
  return { 
    productId, 
    name, 
    price, 
    image: typeof image === "string" ? image : "", 
    stock, 
    quantity: Math.min(quantity, MAX_QUANTITY), 
  }; 
} 
 
function loadCart() { 
  try { 
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); 
    if (!Array.isArray(saved)) return []; 
 
    const seen = new Set(); 
    const clean = []; 
    saved.slice(0, MAX_LINES).forEach((raw) => { 
      const item = cleanItem(raw); 
      if (item && !seen.has(item.productId)) { 
        seen.add(item.productId); 
        clean.push(item); 
      } 
    }); 
    return clean; 
  } catch { 
    return []; 
  } 
} 
 
export function CartProvider({ children }) { 
  // Each item: { productId, name, price, image, stock, quantity } 
  // name / price / image / stock are only a DISPLAY snapshot. The 
  // server checks the real values (see useCartQuote). 
  const [items, setItems] = useState(loadCart); 
 
  // Save on every change 
  useEffect(() => { 
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); 
    } catch { 
      /* storage unavailable: ignore */ 
    } 
  }, [items]); 
 
  // If the cart changes in ANOTHER browser tab, follow it 
  useEffect(() => { 
    const onStorage = (event) => { 
      if (event.key === STORAGE_KEY || event.key === null) { 
        setItems(loadCart()); 
      } 
    }; 
    window.addEventListener("storage", onStorage); 
    return () => window.removeEventListener("storage", onStorage); 
  }, []); 
 
  // Returns { ok: true/false, message } so the screen can tell the visitor. 
  const addItem = (product, quantity = 1) => { 
    if (!product || !OBJECT_ID.test(String(product._id))) { 
      return { ok: false, message: "This product cannot be added." }; 
    } 
    if (!Number.isInteger(quantity) || quantity < 1) { 
      return { ok: false, message: "Quantity must be at least 1." }; 
    } 
    if (!(product.stock >= 1)) { 
      return { ok: false, message: "This product is out of stock." }; 
    } 
 
    const limit = Math.min(product.stock, MAX_QUANTITY); 
    const existing = items.find((i) => i.productId === product._id); 
    const current = existing ? existing.quantity : 0; 
 
    if (!existing && items.length >= MAX_LINES) { 
      return { 
        ok: false, 
        message: `Your cart is full (${MAX_LINES} different products).`, 
      }; 
    } 
    if (current >= limit) { 
      return { 
        ok: false, 
        message: `You already have the maximum available (${limit}) in your cart.`, 
      }; 
    } 
 
    const nextQuantity = Math.min(current + quantity, limit); 
    const line = { 
      productId: product._id, 
      name: product.name, 
      price: product.price, 
      image: (product.image && product.image.url) || "", 
      stock: product.stock, 
      quantity: nextQuantity, 
    }; 
 
    setItems((prev) => { 
      const found = prev.some((i) => i.productId === line.productId); 
      if (!found) return [...prev, line]; 
      return prev.map((i) => (i.productId === line.productId ? line : i)); 
    }); 
 
    if (current + quantity > limit) { 
      return { 
        ok: true, 
        message: `Only ${limit} available. Your cart now has ${nextQuantity}.`, 
      }; 
    } 
    return { ok: true, message: "Added to cart." }; 
  }; 
 
  // The quantity can never go below 1 or above the stock we know about. 
  const updateQuantity = (productId, quantity) => { 
    const number = Math.floor(Number(quantity)); 
    if (!Number.isFinite(number)) return; 
 
    setItems((prev) => 
      prev.map((i) => { 
        if (i.productId !== productId) return i; 
        const safe = Math.max(1, Math.min(number, i.stock, MAX_QUANTITY)); 
        return { ...i, quantity: safe }; 
      }) 
    ); 
  }; 
 
  const removeItem = (productId) => 
    setItems((prev) => prev.filter((i) => i.productId !== productId)); 
 
  const clearCart = () => setItems([]); 
 
  // Applies the server's answer to the saved cart: 
  //   unavailable or out of stock -> removed 
  //   everything else             -> fresh name, price, image, stock, 
  //                                  and the quantity limited to stock 
  const syncWithQuote = (lines) => { 
    const byId = new Map(lines.map((line) => [line.productId, line])); 
 
    setItems((prev) => 
      prev.flatMap((item) => { 
        const line = byId.get(item.productId); 
        if (!line) return [item]; 
        if (line.status === "unavailable") return []; 
        if (line.status === "out_of_stock") return []; 
 
        return [ 
          { 
            ...item, 
            name: line.name, 
            price: line.price, 
            image: line.image || "", 
            stock: line.stock, 
            quantity: Math.min(item.quantity, line.stock), 
          }, 
        ]; 
      }) 
    ); 
  }; 
 
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0); 
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0); 
  // ESTIMATES from the saved snapshot. The cart and checkout pages show 
  // the server's verified totals instead. 
  const prices = calculatePrices(subtotal); 
 
  const value = { 
    items, 
    addItem, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    syncWithQuote, 
    totalItems, 
    ...prices, 
  }; 
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>; 
} 
 
// eslint-disable-next-line react-refresh/only-export-components 
export function useCart() { 
  const context = useContext(CartContext); 
  if (!context) throw new Error("useCart must be used inside CartProvider"); 
  return context; 
} 
 

