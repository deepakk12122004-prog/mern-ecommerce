// Props: 
//   title    - form heading 
//   subtitle - small text under the heading 
//   footer   - content under the form (usually a link to the other page) 
//   children - the form itself 
function AuthLayout({ title, subtitle, footer, children }) { 
  return ( 
    <div className="container py-4 py-md-5"> 
      <div className="auth-card"> 
        <div className="row g-0"> 
          {/* Decorative side panel: hidden on phones */} 
          <div className="col-md-5 auth-side d-none d-md-flex"> 
            <h2 className="h3 mb-3">Welcome to MERN Store</h2> 
            <p className="mb-4">Create an account to shop faster.</p> 
            <ul className="list-unstyled mb-0"> 
              <li>&#10003; Save your cart between visits</li> 
              <li>&#10003; Check out in a few steps</li> 
              <li>&#10003; Track your orders</li> 
            </ul> 
          </div> 
 
          <div className="col-12 col-md-7"> 
            <div className="auth-form"> 
              <h1 className="h3 mb-1">{title}</h1> 
              {subtitle && <p className="text-muted mb-4">{subtitle}</p>} 
 
              {children} 
 
              {footer && <p className="mt-4 mb-0 text-center">{footer}</p>} 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default AuthLayout;