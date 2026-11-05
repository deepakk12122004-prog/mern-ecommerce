import ProductCard from "./ProductCard"; 
 
// Responsive grid: 2 columns on phones, 3 on tablets, 4 on desktops 
function ProductGrid({ products, onAddToCart }) { 
  return ( 
    <div className="row g-3 g-lg-4"> 
      {products.map((product) => ( 
        <div className="col-6 col-md-4 col-lg-3" key={product._id}> 
          <ProductCard product={product} onAddToCart={onAddToCart} /> 
        </div> 
      ))} 
    </div> 
  ); 
} 
 
export default ProductGrid; 