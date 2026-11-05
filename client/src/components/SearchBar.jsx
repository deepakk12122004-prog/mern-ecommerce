 
import { useState, useEffect } from "react"; 
 
// Props: 
//   initialValue - starting text (for example from the URL) 
//   placeholder  - hint text inside the input 
//   onSearch     - function called with the search text when the user 
//                  submits or clears. The PARENT decides what to do with it. 
function SearchBar({ 
  initialValue = "", 
  placeholder = "Search products...", 
  onSearch, 
}) { 
  const [term, setTerm] = useState(initialValue); 
 
  // Keep the input in sync if the parent changes initialValue 
  useEffect(() => { 
    setTerm(initialValue); 
  }, [initialValue]); 
 
  const handleSubmit = (e) => { 
    e.preventDefault(); // stop the browser from reloading the page 
    if (onSearch) onSearch(term.trim()); 
  }; 
 
  const handleClear = () => { 
    setTerm(""); 
    if (onSearch) onSearch(""); 
  }; 
 
  return ( 
    <form className="search-bar" onSubmit={handleSubmit} role="search"> 
      <svg 
        className="search-icon" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden="true" 
      > 
        <circle cx="11" cy="11" r="8" /> 
        <line x1="21" y1="21" x2="16.65" y2="16.65" /> 
      </svg> 
 
      <input 
        type="search" 
        className="form-control" 
        placeholder={placeholder} 
        aria-label="Search" 
        value={term} 
        onChange={(e) => setTerm(e.target.value)} 
      /> 
 
      {term && ( 
        <button 
          type="button" 
          className="btn btn-link text-muted text-decoration-none px-2" 
          onClick={handleClear} 
        > 
          Clear 
        </button> 
      )} 
 
      <button type="submit" className="btn btn-primary px-4"> 
        Search 
      </button> 
    </form> 
  ); 
} 
 
export default SearchBar;