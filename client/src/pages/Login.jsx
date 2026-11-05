import { useState } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
import useForm from "../hooks/useForm"; 
import AuthLayout from "../components/AuthLayout"; 
import FormField from "../components/FormField"; 
import ErrorMessage from "../components/ErrorMessage"; 
 
// Returns an object of error messages (empty object = valid) 
function validate({ email, password }) { 
  const errors = {}; 
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) { 
    errors.email = "Enter a valid email address."; 
  } 
  if (!password) errors.password = "Password is required."; 
  return errors; 
} 
 
function Login() { 
  const { login } = useAuth(); 
  const location = useLocation(); 
 
  const { values, handleChange } = useForm({ email: "", password: "" }); 
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [error, setError] = useState(""); 
  const [submitting, setSubmitting] = useState(false); 
 
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setError(""); 
 
    const errors = validate(values); 
    setFieldErrors(errors); 
    if (Object.keys(errors).length > 0) return; 
 
    setSubmitting(true); 
    try { 
      // On success, GuestRoute notices the new user and redirects. 
      await login(values.email.trim(), values.password); 
    } catch (err) { 
      // Messages about one field go under that field. 
      // Anything else (wrong password, server down) goes in the alert. 
      const serverFields = err.fieldErrors || {}; 
      if (Object.keys(serverFields).length > 0) { 
        setFieldErrors(serverFields); 
      } else { 
        setError(err.message); 
      } 
      setSubmitting(false); 
    } 
  }; 
 
  return ( 
    <AuthLayout 
      title="Welcome back" 
      subtitle="Log in to your account to continue." 
      footer={ 
        <> 
          New here?{" "} 
          <Link to="/register" state={location.state}> 
            Create an account 
          </Link> 
        </> 
      } 
    > 
      {error && <ErrorMessage message={error} />} 
 
      <form onSubmit={handleSubmit} noValidate> 
        {/* A disabled fieldset disables every input and button inside */} 
        <fieldset disabled={submitting}> 
          <FormField 
            id="email" 
            label="Email" 
            type="email" 
            value={values.email} 
            onChange={handleChange} 
            error={fieldErrors.email} 
            autoComplete="email" 
          /> 
          <FormField 
            id="password" 
            label="Password" 
            type="password" 
            value={values.password} 
            onChange={handleChange} 
            error={fieldErrors.password} 
            autoComplete="current-password" 
          /> 
          <button type="submit" className="btn btn-primary btn-lg w-100"> 
            {submitting ? "Logging in..." : "Login"} 
          </button> 
        </fieldset> 
      </form> 
    </AuthLayout> 
  ); 
} 
 
export default Login;