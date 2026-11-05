import { useState, useEffect, useCallback } from "react"; 
 
// Runs an async function and tracks loading / error / data for us. 
//   fetcher - function returning a Promise 
//             (for example () => getProducts()) 
//   deps    - when any of these change, the data is fetched again 
// Returns { data, loading, error, errorStatus, reload } 
//   errorStatus - the HTTP status of the failure (like 404), if any 
export default function useFetch(fetcher, deps = []) { 
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
  const [errorStatus, setErrorStatus] = useState(null); 
  const [reloadKey, setReloadKey] = useState(0); 
 
  useEffect(() => { 
    let cancelled = false; // ignore results if the page changed meanwhile 
    setLoading(true); 
    setError(""); 
    setErrorStatus(null); 
 
    fetcher() 
      .then((result) => { 
        if (!cancelled) setData(result); 
      }) 
      .catch((err) => { 
        if (cancelled) return; 
        setError(err.message || "Something went wrong."); 
        setErrorStatus(err.status || null); 
      }) 
      .finally(() => { 
        if (!cancelled) setLoading(false); 
      }); 
 
    return () => { 
      cancelled = true; 
    }; 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [...deps, reloadKey]); 
 
  const reload = useCallback(() => setReloadKey((k) => k + 1), []); 
 
  return { data, loading, error, errorStatus, reload }; 
} 
 
 

