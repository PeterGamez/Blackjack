"use client"

import { useState } from "react"

export default function PaymentPage() {

const [method,setMethod] = useState("qr")

return (

<div
style={{
background:"#f0f2f5",
minHeight:"100vh",
paddingTop:"120px"
}}
>

{/* TITLE */}
<h1
style={{
textAlign:"center",
marginBottom:"30px"
}}
>
Payment
</h1>


{/* PAYMENT BOX */}
<div
style={{
maxWidth:"900px",
margin:"auto",
background:"#7b8caf",
borderRadius:"16px",
padding:"40px",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>


{/* ORDER SUMMARY */}
<div
style={{
width:"230px",
background:"#e5e7ec",
borderRadius:"6px",
overflow:"hidden"
}}
>

<div
style={{
background:"#e3b75c",
padding:"14px",
fontWeight:"600",
textAlign:"center"
}}
>
Order Summary
</div>


<div style={{padding:"20px",fontSize:"14px"}}>

<div
style={{
display:"flex",
justifyContent:"space-between",
marginBottom:"10px"
}}
>
<span>Package</span>
<span>10,000 Tokens</span>
</div>


<div
style={{
display:"flex",
justifyContent:"space-between",
marginBottom:"20px"
}}
>
<span>Price</span>
<span>729 THB</span>
</div>


<hr/>


<div
style={{
display:"flex",
justifyContent:"space-between",
marginTop:"20px",
fontWeight:"600"
}}
>
<span>Total</span>
<span>729 THB</span>
</div>

</div>
</div>


{/* PAYMENT METHOD */}
<div style={{width:"350px"}}>


{/* QR */}
<div
onClick={()=>setMethod("qr")}
style={{
border:"2px solid #2c3344",
padding:"18px",
marginBottom:"20px",
cursor:"pointer",
background: method==="qr" ? "#8fa1c5":"transparent"
}}
>

<div style={{display:"flex",gap:"10px"}}>

<input
type="radio"
checked={method==="qr"}
readOnly
/>

<div>
<div>QR Code (PromptPay)</div>
<div style={{fontSize:"12px"}}>
Scan To Pay With Your Banking App
</div>
</div>

</div>
</div>


{/* TRUEMONEY */}
<div
onClick={()=>setMethod("truemoney")}
style={{
border:"2px solid #2c3344",
padding:"18px",
cursor:"pointer",
background: method==="truemoney" ? "#8fa1c5":"transparent"
}}
>

<div style={{display:"flex",gap:"10px"}}>

<input
type="radio"
checked={method==="truemoney"}
readOnly
/>

<div>
<div>Truemoney Envelope</div>
<div style={{fontSize:"12px"}}>
Paste The Gift Envelope Link
</div>
</div>

</div>

</div>


</div>

</div>


{/* CONFIRM BUTTON */}
<div
style={{
textAlign:"center",
marginTop:"30px"
}}
>

<button
style={{
background:"linear-gradient(90deg,#f6d07a,#e3b75c)",
border:"none",
padding:"14px 36px",
borderRadius:"30px",
fontWeight:"600",
cursor:"pointer"
}}
>
CONFIRM PAYMENT
</button>

</div>


</div>

)
}