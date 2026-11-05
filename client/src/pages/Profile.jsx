import { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
import useForm from "../hooks/useForm"; 
import FormField from "../components/FormField"; 
import ErrorMessage from "../components/ErrorMessage"; 
 
function Profile() { 
  const { user, updateProfile, logout } = useAuth(); 
  const navigate = useNavigate(); 
  const { values, handleChange } = useForm({ name: user.name }); 
  const [nameError, setNameError] = useState(""); 
  const [error, setError] = useState(""); 
  const [saved, setSaved] = useState(false); 
  const [saving, setSaving] = useState(false); 
 
  const handleSave = async (e) => { 
    e.preventDefault(); 
    setError(""); 
    setSaved(false); 
 
    if (values.name.trim().length < 2) { 
      setNameError("Name must be at least 2 characters."); 
      return; 
    } 
    setNameError(""); 
    setSaving(true); 
    try { 
      await updateProfile(values.name.trim()); 
      setSaved(true); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    } 
  }; 
 
  const handleLogout = () => { 
    navigate("/"); // leave this protected page first 
    logout(); 
  }; 
 
  return ( 
    <div className="container py-4"> 
      <h1 className="h3 mb-4">My profile</h1> 
 
      <div className="row g-4"> 
        <div className="col-12 col-lg-7"> 
          <div className="card shadow-sm"> 
            <div className="card-body"> 
              {error && <ErrorMessage message={error} />} 
              {saved && ( 
                <div className="alert alert-success" role="status"> 
                  Profile updated. 
                </div> 
              )} 
 
              <form onSubmit={handleSave} noValidate> 
                <FormField id="name" label="Full name" value={values.name} 
onChange={handleChange} error={nameError} /> 
                <FormField id="email" label="Email" type="email" value={user.email} 
onChange={() => {}} readOnly disabled /> 
                <p> 
                  Role: <span className="badge bg-secondary">{user.role}</span> 
                </p> 
                <button type="submit" className="btn btn-primary" disabled={saving}> 
                  {saving ? "Saving..." : "Save changes"} 
                </button> 
              </form> 
            </div> 
          </div> 
        </div> 
 
        <div className="col-12 col-lg-5"> 
          <div className="card shadow-sm"> 
            <div className="card-body d-grid gap-2"> 
              <Link to="/orders" className="btn btn-outline-primary"> 
                View my orders 
              </Link> 
              <button type="button" className="btn btn-outline-danger" 
onClick={handleLogout}> 
                Logout 
              </button> 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default Profile;