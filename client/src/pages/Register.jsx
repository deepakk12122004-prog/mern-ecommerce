import { useState } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
import useForm from "../hooks/useForm"; 
import AuthLayout from "../components/AuthLayout"; 
import FormField from "../components/FormField"; 
import ErrorMessage from "../components/ErrorMessage"; 
 
// Returns an object of error messages (empty object = valid). 
// The server checks all of this again, so this is only for speed. 
function validate({ name, email, password, confirmPassword }) { 
  const errors = {}; 
  if (name.trim().length < 2) { 
    errors.name = "Name must be at least 2 characters."; 
  } 
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) { 
    errors.email = "Enter a valid email address."; 
  } 
  if (password.length < 8) { 
    errors.password = "Password must be at least 8 characters."; 
  } 
  if (confirmPassword !== password) { 
    errors.confirmPassword = "Passwords do not match."; 
  } 
  return errors; 
} 
 
function Register() { 
  const { register } = useAuth(); 
  const location = useLocation(); 
 
  const { values, handleChange } = useForm({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "", 
  }); 
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
      await register(values.name.trim(), values.email.trim(), values.password); 
    } catch (err) { 
      const serverFields = err.fieldErrors || {}; 
      if (err.status === 409) { 
        // "An account with this email already exists." 
        setFieldErrors({ email: err.message }); 
      } else if (Object.keys(serverFields).length > 0) { 
        setFieldErrors(serverFields); 
      } else { 
        setError(err.message); 
      } 
      setSubmitting(false); 
    } 
  }; 
 
  return ( 
    <AuthLayout 
      title="Create your account" 
      subtitle="It only takes a minute." 
      footer={ 
        <> 
          Already have an account?{" "} 
          <Link to="/login" state={location.state}> 
            Login 
          </Link> 
        </> 
      } 
    > 
      {error && <ErrorMessage message={error} />} 
 
      <form onSubmit={handleSubmit} noValidate> 
        <fieldset disabled={submitting}> 
          <FormField 
            id="name" 
            label="Full name" 
            value={values.name} 
            onChange={handleChange} 
            error={fieldErrors.name} 
            autoComplete="name" 
          /> 
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
            autoComplete="new-password" 
          /> 
          <FormField 
            id="confirmPassword" 
            label="Confirm password" 
            type="password" 
            value={values.confirmPassword} 
            onChange={handleChange} 
            error={fieldErrors.confirmPassword} 
            autoComplete="new-password" 
          /> 
          <button type="submit" className="btn btn-primary btn-lg w-100"> 
            {submitting ? "Creating account..." : "Register"} 
          </button> 
        </fieldset> 
      </form> 
    </AuthLayout> 
  ); 
} 
 
export default Register;