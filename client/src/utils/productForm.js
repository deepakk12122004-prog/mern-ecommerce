import { formatPrice } from "./formatPrice"; 
 
// Values for an empty "create product" form 
export const EMPTY_PRODUCT_VALUES = { 
  name: "", 
  description: "", 
  price: "", 
  category: "", 
  stock: "0", 
  isActive: true, 
}; 
 
// Turns a product from the API into form values (forms use text) 
export function productToFormValues(product) { 
  return { 
    name: product.name || "", 
    description: product.description || "", 
    price: String(product.price ?? ""), 
    category: product.category || "", 
    stock: String(product.stock ?? 0), 
    isActive: product.isActive !== false, 
  }; 
} 
 
// Checks the form values (the same rules as the server). 
// Returns { errors, data }: 
//   errors - { fieldName: "message" } (empty = valid) 
//   data   - cleaned values, ready to send to the API 
// Prices are in rupees. 
export function validateProductForm(values) { 
  const errors = {}; 
 
  const name = values.name.trim(); 
  const description = values.description.trim(); 
  const category = values.category.trim(); 
  const priceText = String(values.price).trim(); 
  const stockText = String(values.stock).trim(); 
 
  if (name.length < 2 || name.length > 120) { 
    errors.name = "Name must be 2 to 120 characters."; 
  } 
 
  if (description.length < 1 || description.length > 2000) { 
    errors.description = "Description must be 1 to 2000 characters."; 
  } 
 
  const price = Number(priceText); 
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) { 
    errors.price = "Enter a price like 499 or 499.50 (at most 2 decimals)."; 
  } else if (price < 0.01 || price > 1000000) { 
    errors.price = `Price must be between ${formatPrice(0.01)} and ${formatPrice( 
      1000000 
    )}.`; 
  } 
 
  if (category.length < 2 || category.length > 50) { 
    errors.category = "Category must be 2 to 50 characters."; 
  } 
 
  const stock = Number(stockText); 
  const stockOk = 
    /^\d+$/.test(stockText) && Number.isInteger(stock) && stock <= 1000000; 
  if (!stockOk) { 
    errors.stock = "Stock must be a whole number from 0 to 1,000,000."; 
  } 
 
  return { 
    errors, 
    data: { 
      name, 
      description, 
      price, 
      category, 
      stock, 
      isActive: Boolean(values.isActive), 
    }, 
  }; 
}