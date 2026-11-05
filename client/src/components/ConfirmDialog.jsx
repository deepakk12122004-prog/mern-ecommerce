import { useEffect } from "react"; 
 
// A "Are you sure?" pop-up. It is controlled by its parent: 
// the parent decides when `show` is true. 
// Props: 
//   show, title, message 
//   confirmLabel   - text of the main button (default "Delete") 
//   cancelLabel    - text of the other button (default "Cancel") 
//   confirmVariant - Bootstrap colour of the main button (default "danger") 
//   busy           - true while the action is running 
//   error          - optional error text shown inside the pop-up 
//   onConfirm, onCancel 
function ConfirmDialog({ 
  show, 
  title, 
  message, 
  confirmLabel = "Delete", 
  cancelLabel = "Cancel", 
  confirmVariant = "danger", 
  busy = false, 
  error = "", 
  onConfirm, 
  onCancel, 
}) { 
  // Escape closes the pop-up (unless it is busy) 
  useEffect(() => { 
    if (!show) return undefined; 
    const onKey = (event) => { 
      if (event.key === "Escape" && !busy) onCancel(); 
    }; 
    document.addEventListener("keydown", onKey); 
    return () => document.removeEventListener("keydown", onKey); 
  }, [show, busy, onCancel]); 
 
  if (!show) return null; 
 
  return ( 
    <> 
      <div 
        className="modal d-block" 
        tabIndex="-1" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="confirm-title" 
      > 
        <div className="modal-dialog modal-dialog-centered"> 
          <div className="modal-content"> 
            <div className="modal-header"> 
              <h2 className="modal-title h5" id="confirm-title"> 
                {title} 
              </h2> 
            </div> 
 
            <div className="modal-body"> 
              {message} 
              {error && ( 
                <div className="alert alert-danger mt-3 mb-0" role="alert"> 
                  {error} 
                </div> 
              )} 
            </div> 
 
            <div className="modal-footer"> 
              {/* The safe choice is focused first */} 
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={onCancel} 
                disabled={busy} 
                autoFocus 
              > 
                {cancelLabel} 
              </button> 
              <button 
                type="button" 
                className={`btn btn-${confirmVariant}`} 
                onClick={onConfirm} 
                disabled={busy} 
              > 
                {busy ? "Working..." : confirmLabel} 
              </button> 
            </div> 
          </div> 
        </div> 
      </div> 
      <div className="modal-backdrop show"></div> 
    </> 
  ); 
} 
 
export default ConfirmDialog;