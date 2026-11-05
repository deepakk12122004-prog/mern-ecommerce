const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js"; 
let loading = null; 
// Loads Razorpay's official payment-window script (once) and gives 
// back the window.Razorpay class. The script always comes from 
// Razorpay's own server, so it is never copied into our project. 
export function loadRazorpay() { 
if (window.Razorpay) return Promise.resolve(window.Razorpay); 
if (loading) return loading; 
loading = new Promise((resolve, reject) => { 
const script = document.createElement("script"); 
script.src = SCRIPT_URL; 
    script.async = true; 
 
    script.onload = () => { 
      if (window.Razorpay) { 
        resolve(window.Razorpay); 
      } else { 
        loading = null; 
        reject(new Error("The payment window did not start. Please try again.")); 
      } 
    }; 
 
    script.onerror = () => { 
      loading = null; // allow another try later 
      script.remove(); 
      reject( 
        new Error( 
          "Could not load the payment window. Check your internet " + 
            "connection or ad blocker, then try again." 
        ) 
      ); 
    }; 
 
    document.body.appendChild(script); 
  }); 
 
  return loading; 
} 
