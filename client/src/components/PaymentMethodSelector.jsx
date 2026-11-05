const OPTIONS = [ 
{ 
    value: "COD", 
    title: "Cash on Delivery", 
    text: "Pay in cash when your order arrives.", 
  }, 
  { 
    value: "UPI", 
    title: "UPI Payment", 
    text: "Pay online with any UPI app, such as Google Pay or PhonePe.", 
  }, 
]; 
 
// The two payment choices on the checkout page. 
// Props: 
//   value          - the selected method ("COD" or "UPI") 
//   onChange       - function(method) 
//   enabledMethods - the methods the server allows right now 
//                    (from GET /api/payments/methods) 
//   disabled       - true while an order is being placed 
// A method that is not enabled is shown greyed out. 
function PaymentMethodSelector({ 
  value, 
  onChange, 
  enabledMethods = ["COD"], 
  disabled = false, 
}) { 
  return ( 
    <div role="radiogroup" aria-label="Payment method" className="d-grid gap-2"> 
      {OPTIONS.map((option) => { 
        const available = enabledMethods.includes(option.value); 
        const selected = value === option.value; 
        const id = `payment-${option.value}`; 
        const locked = disabled || !available; 
 
        return ( 
          <label 
            key={option.value} 
            htmlFor={id} 
            className={`border rounded p-3 d-flex gap-3 align-items-start ${ 
              selected ? "border-primary bg-light" : "" 
            } ${available ? "" : "opacity-50"}`} 
            style={{ cursor: locked ? "not-allowed" : "pointer" }} 
          > 
            <input 
              type="radio" 
              className="form-check-input mt-1" 
              id={id} 
              name="paymentMethod" 
              value={option.value} 
              checked={selected} 
              disabled={locked} 
              onChange={() => onChange(option.value)} 
            /> 
            <span> 
              <span className="fw-semibold d-block"> 
                {option.title} 
                {!available && ( 
                  <span className="badge bg-secondary ms-2"> 
                    Not available 
                  </span> 
                )} 
              </span> 
              <span className="small text-muted">{option.text}</span> 
            </span> 
          </label> 
        ); 
      })} 
    </div> 
  ); 
} 
 
export default PaymentMethodSelector; 