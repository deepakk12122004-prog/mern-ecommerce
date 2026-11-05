// Builds the list of buttons to show, for example for page 5 of 10: 
// [1, "...", 4, 5, 6, "...", 10] 
function getPageItems(page, totalPages) { 
  const items = []; 
  for (let p = 1; p <= totalPages; p += 1) { 
    const isEdge = p === 1 || p === totalPages; 
    const isNearby = Math.abs(p - page) <= 1; 
    if (isEdge || isNearby) { 
      items.push(p); 
    } else if (items[items.length - 1] !== "...") { 
      items.push("..."); 
    } 
  } 
  return items; 
} 
 
// Props: 
//   page         - the current page (starts at 1) 
//   totalPages   - how many pages exist 
//   onPageChange - function(newPage) 
function Pagination({ page, totalPages, onPageChange }) { 
  if (!totalPages || totalPages <= 1) return null; 
 
  const items = getPageItems(page, totalPages); 
 
  return ( 
    <nav 
      className="mt-4 d-flex justify-content-center" 
      aria-label="Product pages" 
    > 
      <ul className="pagination mb-0 flex-wrap justify-content-center"> 
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}> 
          <button 
            type="button" 
            className="page-link" 
            disabled={page <= 1} 
            onClick={() => onPageChange(page - 1)} 
          > 
            Previous 
          </button> 
        </li> 
 
        {items.map((item, index) => 
          item === "..." ? ( 
            <li key={`gap-${index}`} className="page-item disabled"> 
              <span className="page-link">&hellip;</span> 
            </li> 
          ) : ( 
            <li 
              key={item} 
              className={`page-item ${item === page ? "active" : ""}`} 
            > 
              <button 
                type="button" 
                className="page-link" 
                aria-current={item === page ? "page" : undefined} 
                onClick={() => onPageChange(item)} 
              > 
                {item} 
              </button> 
            </li> 
          ) 
        )} 
 
        <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}> 
          <button 
            type="button" 
            className="page-link" 
            disabled={page >= totalPages} 
            onClick={() => onPageChange(page + 1)} 
          > 
            Next 
          </button> 
        </li> 
      </ul> 
</nav> 
); 
} 
export default Pagination;