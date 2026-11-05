// Shows how healthy a product's stock is. 
// Props: 
//   stock     - number in stock 
//   threshold - "low" means 1 up to this number (the server sends it) 
function StockBadge({ stock, threshold = 5 }) { 
  if (stock <= 0) return <span className="badge bg-danger">Out of stock</span>; 
  if (stock <= threshold) { 
    return <span className="badge bg-warning text-dark">Low stock</span>; 
  } 
  return <span className="badge bg-success">In stock</span>; 
} 
 
export default StockBadge;