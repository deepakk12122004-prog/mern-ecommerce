import { useState } from "react"; 
 
// Keeps form values in state. Each input's `name` must match a key 
// in initialValues. 
export default function useForm(initialValues) { 
  const [values, setValues] = useState(initialValues); 
 
  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setValues((prev) => ({ ...prev, [name]: value })); 
  }; 
 
  return { values, setValues, handleChange }; 
} 
 
 
