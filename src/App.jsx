import { useState, useEffect, useRef } from "react";

const CONFIG = {
  RAZORPAY_KEY:  "rzp_live_SgojwGSyyoA4xy",
  WHATSAPP:      "919717798541",
};

const PRICES = { single: 19, monthly: 199, annual: 1999 };

const TOOLS = [
  { id:"resume", icon:"◈", label:"Resume Builder", color:"#F5C518", gradient:"linear-gradient(135deg,#F5C518,#FF9F1C)",
    desc:"ATS-friendly resume crafted in seconds",
    fields:[{k:"name",l:"Full Name",p:"Arun Kumar"},{k:"role",l:"Target Role",p:"Software Engineer at Google"},{k:"exp",l:"Experience",p:"3 yrs at Infosys, built React apps..."},{k:"skills",l:"Skills",p:"React, Python, AWS, Leadership"}],
    prompt:f=>`Write an ATS-optimised resume for ${f.name} targeting ${f.role}. Experience: ${f.exp}. Skills: ${f.skills}. Sections: Summary, Experience, Skills, Education.` },
  { id:"cover", icon:"✦", label:"Cover Letter", color:"#00E5A0", gradient:"linear-gradient(135deg,#00E5A0,#00B4D8)",
    desc:"Memorable letter that opens doors",
    fields:[{k:"name",l:"Your Name",p:"Priya Sharma"},{k:"company",l:"Company",p:"Amazon"},{k:"role",l:"Role",p:"Product Manager"},{k:"why",l:"Why this role?",p:"Passionate about customer obsession..."}],
    prompt:f=>`Write an engaging cover letter from ${f.name} to ${f.company} for ${f.role}. Motivation: ${f.why}. 3 warm confident paragraphs, no filler.` },
  { id:"blog", icon:"◉", label:"Blog Post", color:"#FF4D6D", gradient:"linear-gradient(135deg,#FF4D6D,#C9184A)",
    desc:"SEO-optimised content in one click",
    fields:[{k:"topic",l:"Topic",p:"How AI is changing education in India"},{k:"audience",l:"Audience",p:"College students, educators"},{k:"tone",l:"Tone",p:"Inspiring, conversational"}],
    prompt:f=>`Write a 700-word SEO blog post: "${f.topic}" for ${f.audience}. Tone: ${f.tone}. Include: catchy title, hook intro, 5-6 subheadings, conclusion with CTA.` },
  { id:"email", icon:"⬡", label:"Email Writer", color:"#4895EF", gradient:"linear-gradient(135deg,#4895EF,#4361EE)",
    desc:"Emails that actually get replies",
    fields:[{k:"purpose",l:"Purpose",p:"Ask for a salary raise"},{k:"to",l:"Recipient",p:"My manager"},{k:"tone",l:"Tone",p:"Confident, professional"},{k:"points",l:"Key Points",p:"2 yrs no raise, promoted twice, market rate..."}],
    prompt:f=>`Write a ${f.tone} email. Purpose: ${f.purpose}. To: ${f.to}. Key points: ${f.points}. Concise, persuasive. Include subject line.` },
];

const INR  = n => `₹${Number(n).toLocaleString("en-IN")}`;
const uid  = () => Math.random().toString(36).slice(2,8).toUpperCase();
const nowT = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const nowD = () => new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short"});

const PLANS = [
  { id:"single", label:"Per Use", price:PRICES.single, per:"per service", tag:null, color:"#4895EF",
    features:["1 AI generation","Choose any tool","No commitment"],
    note:"Pay only when needed. Break-even vs Monthly at 11 uses." },
  { id:"monthly", label:"Monthly", price:PRICES.monthly, per:"/month", tag:"POPULAR", color:"#F5C518",
    features:["Unlimited generations","All 4 tools","Priority support","Cancel anytime"],
    note:"Save ₹181 vs 20 per-use/month." },
  { id:"annual", label:"Annual", price:PRICES.annual, per:"/year", tag:"SAVE 16%", color:"#00E5A0",
    features:["Everything in Monthly","Effective ₹167/mo","Early tool access","VIP support"],
    note:"Save ₹399 vs paying monthly." },
];

const SEED_TX = [
  {id:"R7K2P1",method:"Razorpay",plan:"Monthly",amount:199, date:"19 Apr",time:"09:14",status:"paid"},
  {id:"W4M8Q3",method:"WhatsApp",plan:"Per Use",amount:19,  date:"19 Apr",time:"11:32",status:"paid"},
  {id:"U2X6N5",method:"UPI",     plan:"Per Use",amount:19,  date:"18 Apr",time:"15:45",status:"paid"},
  {id:"R9B3D7",method:"Razorpay",plan:"Annual", amount:1999,date:"17 Apr",time:"19:20",status:"paid"},
  {id:"W1C5E9",method:"WhatsApp",plan:"Monthly",amount:199, date:"16 Apr",time:"14:10",status:"paid"},
  {id:"U8F4G2",method:"UPI",     plan:"Per Use",amount:19,  date:"15 Apr",time:"10:05",status:"paid"},
];

function QR({ amount }) {
  const upiString = `upi://pay?pa=dasarupkumar@icici&pn=WriteAI&am=${amount||""}&cu=INR`;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}&margin=12&format=png`;
  return <img src={src} alt="Scan to pay" width={220} height={220} style={{borderRadius:8,display:"block"}}/>;
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function openRazorpay({ plan, onSuccess, onFail }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) { onFail("Could not load Razorpay. Check your connection."); return; }

  let orderId = null;
  try {
    const order = await fetch("/api/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: plan.price, planId: plan.id })
    }).then(r => r.json());
    orderId = order.orderId;
  } catch (e) {
    onFail("Could not create order. Please try again."); return;
  }

  const options = {
    key:         CONFIG.RAZORPAY_KEY,
    amount:      plan.price * 100,
    currency:    "INR",
    name:        CONFIG.BUSINESS_NAME,
    description: plan.label + " Plan",
    order_id:    orderId,
    prefill:     { contact: CONFIG.WHATSAPP.slice(2) },
    theme:       { color: "#F5C518" },
    modal:       { ondismiss: () => onFail("Payment cancelled") },
    handler: async function(response) {
      try {
        const result = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          })
        }).then(r => r.json());
        if (result.verified) {
          onSuccess(response.razorpay_payment_id);
        } else {
          onFail("Payment could not be verified. Contact support.");
        }
      } catch(e) {
        onFail("Verification failed. Please contact support.");
      }
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", e => onFail(e.error?.description || "Payment failed"));
  rzp.open();
}

function AnimNum({ value, prefix = "" }) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    let start = 0; const end = value;
    const step = () => {
      start += Math.ceil(end / 75);
      if (start >= end) { setDisp(end); return; }
      setDisp(start); requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{prefix}{disp.toLocaleString("en-IN")}</>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(245,197,24,0.3);border-radius:2px}
@keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,-40px)}}
@keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,70px)}}
@keyframes orb3{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,50px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(245,197,24,0.4)}70%{box-shadow:0 0 0 12px rgba(245,197,24,0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{opacity:0.5}50%{opacity:1}}
.fadeUp{animation:fadeUp 0.6s ease both}
.fadeUp:nth-child(1){animation-delay:0.05s}
.fadeUp:nth-child(2){animation-delay:0.12s}
.fadeUp:nth-child(3){animation-delay:0.19s}
.fadeUp:nth-child(4){animation-delay:0.26s}
.tool-card{transition:transform 0.25s ease,box-shadow 0.25s ease}
.tool-card:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,0.4)!important}
.plan-card{transition:transform 0.25s ease}
.plan-card:hover{transform:translateY(-4px)}
.glow-btn{animation:pulse 2.5s infinite}
.glow-btn:hover{transform:scale(1.03)}
.nav-btn{transition:all 0.2s}
.nav-btn:hover{background:rgba(245,197,24,0.1)!important;color:#F5C518!important}
.shimmer-line{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);background-size:200% 100%;animation:shimmer 2.5s infinite}
.copy-btn:hover{background:rgba(245,197,24,0.2)!important}
.tab-btn{transition:all 0.2s}
textarea:focus,input:focus{border-color:rgba(245,197,24,0.5)!important;box-shadow:0 0 0 3px rgba(245,197,24,0.1)!important;outline:none!important}
`;

export default function App() {
  const [view,      setView]      = useState("home");
  const [activeTool,setActiveTool]= useState(null);
  const [fields,    setFields]    = useState({});
  const [output,    setOutput]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [showPay,   setShowPay]   = useState(false);
  const [payTab,    setPayTab]    = useState("razorpay");
  const [payStatus, setPayStatus] = useState("idle");
  const [payMsg,    setPayMsg]    = useState("");
  const [selPlan,   setSelPlan]   = useState(null);
  const [txList,    setTxList]    = useState(SEED_TX);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const totalEarned = txList.reduce((s,t)=>s+t.amount,0);
  const thisMonth   = txList.filter(t=>t.date.includes("Apr")).reduce((s,t)=>s+t.amount,0);
  const byMethod    = txList.reduce((a,t)=>{a[t.method]=(a[t.method]||0)+t.amount;return a},{});
  const byPlan      = txList.reduce((a,t)=>{a[t.plan]=(a[t.plan]||0)+1;return a},{});

  const openPayModal = plan => { setSelPlan(plan); setPayStatus("idle"); setPayMsg(""); setShowPay(true); };
  const addTx = (method,planLabel,amount) => {
    setTxList(p=>[{id:uid(),method,plan:planLabel,amount,date:nowD(),time:nowT(),status:"paid"},...p]);
  };

  const handleRazorpay = async () => {
    setPayStatus("processing");
    await openRazorpay({
      plan: selPlan,
      onSuccess: (pid) => { addTx("Razorpay",selPlan.label,selPlan.price); setPayStatus("done"); setPayMsg(`Payment ID: ${pid}`); },
      onFail: (msg) => { setPayStatus("error"); setPayMsg(msg); },
    });
    if (payStatus==="processing") setPayStatus("idle");
  };

  const generate = async () => {
    if (!activeTool) return;
    const empty = activeTool.fields.find(f=>!fields[f.k]?.trim());
    if (empty) return alert(`Please fill in: ${empty.l}`);
    setLoading(true); setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: activeTool.prompt(fields) }),
      });
      const d = await res.json();
      setOutput(d.text || "No output generated.");
    } catch { setOutput("Error. Please try again."); }
    setLoading(false);
  };

  const waLink = selPlan
    ? `https://wa.me/${CONFIG.WHATSAPP}?text=Hi%2C+I%27d+like+to+pay+${encodeURIComponent(INR(selPlan.price))}+for+WriteAI+${encodeURIComponent(selPlan.label)}+plan.+Please+confirm.`
    : "#";

  const discRows = [5,10,20,50].map(u=>({u,
    single: u*PRICES.single,
    savMon: Math.max(0,u*PRICES.single-PRICES.monthly),
    savAnn: Math.max(0,u*PRICES.single*12-PRICES.annual),
  }));

  const F = font;

  return (
    <div style={{minHeight:"100vh",background:"#0D0D1A",color:"#F0EAD6",fontFamily:"'DM Sans',sans-serif",position:"relative",overflowX:"hidden"}}>

      {/* BACKGROUND */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-10%",left:"-10%",width:"50vw",height:"50vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(245,197,24,0.07) 0%,transparent 70%)",animation:"orb1 12s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:0,right:"-10%",width:"45vw",height:"45vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,160,0.05) 0%,transparent 70%)",animation:"orb2 15s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:"30vw",height:"30vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(72,149,239,0.04) 0%,transparent 70%)",animation:"orb3 10s ease-in-out infinite"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(245,197,24,0.04) 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
      </div>

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(13,13,26,0.85)",borderBottom:"1px solid rgba(245,197,24,0.1)"}}>
        <div style={{maxWidth:1040,margin:"0 auto",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{setView("home");setActiveTool(null);}}>
            <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#F5C518,#FF9F1C)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✧</div>
            <span style={{...F.brand}}>WriteAI</span>
            <span style={{fontSize:9,...F.mono,background:"rgba(245,197,24,0.15)",color:"#F5C518",border:"1px solid rgba(245,197,24,0.3)",padding:"2px 7px",borderRadius:4}}>PRO</span>
          </div>
          <nav style={{display:"flex",gap:6}}>
            {[{id:"home",label:"✦ Tools"},{id:"dashboard",label:"📊 Dashboard"}].map(n=>(
              <button key={n.id} className="nav-btn" style={{...F.base,fontSize:12,padding:"7px 14px",borderRadius:8,cursor:"pointer",border:"1px solid",background:view===n.id?"rgba(245,197,24,0.1)":"transparent",borderColor:view===n.id?"rgba(245,197,24,0.35)":"rgba(255,255,255,0.1)",color:view===n.id?"#F5C518":"rgba(240,234,214,0.55)"}}
                onClick={()=>{setView(n.id);if(n.id==="home")setActiveTool(null);}}>
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* HOME */}
      {view==="home" && !activeTool && (
        <main style={{maxWidth:1040,margin:"0 auto",padding:"0 24px 80px",position:"relative",zIndex:1}}>
          <section style={{textAlign:"center",padding:"72px 0 48px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,197,24,0.08)",border:"1px solid rgba(245,197,24,0.2)",borderRadius:20,padding:"5px 14px",marginBottom:24}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#F5C518",animation:"glow 2s infinite"}}/>
              <span style={{...F.mono,fontSize:10,color:"#F5C518",letterSpacing:"0.15em"}}>AI-POWERED WRITING SUITE</span>
            </div>
            <h1 style={{...F.display,fontSize:"clamp(36px,6vw,72px)",lineHeight:1.1,marginBottom:16}}>
              Write Anything.{" "}
              <span style={{background:"linear-gradient(90deg,#F5C518,#FF9F1C)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Earn Everything.</span>
            </h1>
            <p style={{fontSize:16,color:"rgba(240,234,214,0.55)",maxWidth:480,margin:"0 auto 28px",lineHeight:1.7}}>
              Professional resumes, cover letters, blog posts & emails — generated by AI in seconds. Monetise with UPI, WhatsApp & Razorpay.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8}}>
              {["✓ Razorpay","✓ UPI / QR","✓ WhatsApp Pay","✓ GPay","✓ PhonePe","✓ Paytm"].map(b=>(
                <span key={b} style={{...F.mono,fontSize:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:"4px 12px",color:"rgba(240,234,214,0.5)"}}>{b}</span>
              ))}
            </div>
          </section>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16,marginBottom:64}}>
            {TOOLS.map(t=>(
              <button key={t.id} className="tool-card fadeUp" style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"26px 22px",cursor:"pointer",display:"flex",flexDirection:"column",gap:10,textAlign:"left",fontFamily:"inherit",boxShadow:"0 4px 24px rgba(0,0,0,0.2)"}}
                onClick={()=>{setActiveTool(t);setFields({});setOutput("");}}>
                <div style={{width:44,height:44,borderRadius:12,background:t.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#0D0D1A",fontWeight:"bold"}}>{t.icon}</div>
                <div>
                  <div style={{...F.semibold,fontSize:15,color:"#F0EAD6",marginBottom:4}}>{t.label}</div>
                  <div style={{fontSize:12,color:"rgba(240,234,214,0.45)",lineHeight:1.5}}>{t.desc}</div>
                </div>
                <span style={{...F.mono,fontSize:10,color:t.color,marginTop:"auto"}}>Generate →</span>
              </button>
            ))}
          </div>

          <section style={{marginBottom:40}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <p style={{...F.mono,fontSize:10,color:"#F5C518",letterSpacing:"0.18em",marginBottom:10}}>PRICING & SAVINGS</p>
              <h2 style={{...F.display,fontSize:"clamp(24px,4vw,40px)",marginBottom:10}}>Simple, Transparent Pricing</h2>
              <p style={{fontSize:14,color:"rgba(240,234,214,0.45)"}}>Pay per use or save big with a subscription</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16,marginBottom:32}}>
              {PLANS.map(plan=>(
                <div key={plan.id} className="plan-card" style={{background:plan.id==="monthly"?"rgba(245,197,24,0.06)":"rgba(255,255,255,0.025)",border:`1px solid ${plan.id==="monthly"?"rgba(245,197,24,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:20,padding:"28px 22px",display:"flex",flexDirection:"column",gap:8,position:"relative",boxShadow:plan.id==="monthly"?"0 0 40px rgba(245,197,24,0.08)":"none"}}>
                  {plan.tag && <span style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",...F.mono,fontSize:9,fontWeight:"bold",background:plan.id==="monthly"?"#F5C518":"rgba(0,229,160,0.15)",color:plan.id==="monthly"?"#0D0D1A":"#00E5A0",border:plan.id==="monthly"?"none":"1px solid rgba(0,229,160,0.3)",padding:"4px 12px",borderRadius:10,whiteSpace:"nowrap"}}>{plan.tag}</span>}
                  <div style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.4)",letterSpacing:"0.12em"}}>{plan.label.toUpperCase()}</div>
                  <div style={{...F.display,fontSize:32,color:"#F0EAD6"}}>{INR(plan.price)}<span style={{fontSize:13,...F.base,color:"rgba(240,234,214,0.35)",fontWeight:"normal"}}> {plan.per}</span></div>
                  <p style={{fontSize:11,color:plan.color,lineHeight:1.5}}>{plan.note}</p>
                  <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:5,margin:"6px 0"}}>
                    {plan.features.map(f=><li key={f} style={{fontSize:12,color:"rgba(240,234,214,0.6)",display:"flex",alignItems:"center",gap:7}}><span style={{color:plan.color,fontSize:10}}>✓</span>{f}</li>)}
                  </ul>
                  <button className={plan.id==="monthly"?"glow-btn":""} style={{marginTop:"auto",padding:"12px",borderRadius:12,cursor:"pointer",fontSize:13,...F.semibold,fontFamily:"inherit",background:plan.id==="monthly"?"linear-gradient(135deg,#F5C518,#FF9F1C)":"transparent",color:plan.id==="monthly"?"#0D0D1A":plan.color,border:plan.id==="monthly"?"none":`1px solid ${plan.color}44`}}
                    onClick={()=>openPayModal(plan)}>
                    {plan.id==="monthly"?"Get Monthly Pro →":`Pay ${INR(plan.price)}`}
                  </button>
                </div>
              ))}
            </div>

            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"24px 20px"}}>
              <p style={{...F.semibold,fontSize:13,color:"#F0EAD6",marginBottom:4}}>💡 How Much You Save</p>
              <p style={{fontSize:11,color:"rgba(240,234,214,0.4)",marginBottom:18}}>Based on monthly usage</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                      {["Uses/Month","Per-Use Cost","Monthly Plan","You Save (Monthly)","Annual Plan","You Save (Annual/yr)"].map(h=>(
                        <th key={h} style={{...F.mono,fontSize:9,color:"rgba(240,234,214,0.35)",letterSpacing:"0.08em",padding:"8px 12px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {discRows.map((r,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i%2===0?"rgba(255,255,255,0.01)":"transparent"}}>
                        <td style={{padding:"10px 12px",color:"rgba(240,234,214,0.7)",...F.mono,fontSize:11}}>{r.u} uses</td>
                        <td style={{padding:"10px 12px",color:"rgba(240,234,214,0.5)"}}>{INR(r.single)}</td>
                        <td style={{padding:"10px 12px",color:"rgba(240,234,214,0.7)"}}>{INR(PRICES.monthly)}</td>
                        <td style={{padding:"10px 12px",fontWeight:r.savMon>0?"bold":"normal",color:r.savMon>0?"#00E5A0":"rgba(240,234,214,0.25)"}}>
                          {r.savMon>0?`Save ${INR(r.savMon)} (${Math.round(r.savMon/r.single*100)}% off)`:"—"}
                        </td>
                        <td style={{padding:"10px 12px",color:"rgba(240,234,214,0.7)"}}>{INR(PRICES.annual)}</td>
                        <td style={{padding:"10px 12px",fontWeight:"bold",color:r.savAnn>0?"#F5C518":"rgba(240,234,214,0.25)"}}>
                          {r.savAnn>0?`Save ${INR(r.savAnn)} (${Math.round(r.savAnn/(r.u*PRICES.single*12)*100)}% off)`:"—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* TOOL FORM */}
      {view==="home" && activeTool && (
        <div style={{maxWidth:640,margin:"0 auto",padding:"28px 24px 80px",position:"relative",zIndex:1}}>
          <button style={{...F.base,fontSize:12,color:"rgba(240,234,214,0.4)",background:"transparent",border:"none",cursor:"pointer",marginBottom:24}} onClick={()=>{setActiveTool(null);setOutput("");}}>← Back to Tools</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28}}>
            <div style={{width:48,height:48,borderRadius:14,background:activeTool.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#0D0D1A",fontWeight:"bold"}}>{activeTool.icon}</div>
            <h2 style={{...F.display,fontSize:24,color:"#F0EAD6"}}>{activeTool.label}</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {activeTool.fields.map(f=>(
              <div key={f.k}>
                <label style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.45)",letterSpacing:"0.1em",display:"block",marginBottom:6}}>{f.l.toUpperCase()}</label>
                <textarea style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#F0EAD6",fontSize:13,fontFamily:"'DM Sans',sans-serif",padding:"12px 14px",resize:"vertical",lineHeight:1.6,minHeight:64}} placeholder={f.p} rows={2} value={fields[f.k]||""} onChange={e=>setFields({...fields,[f.k]:e.target.value})}/>
              </div>
            ))}
          </div>
          <button style={{width:"100%",padding:"15px",borderRadius:14,border:"none",background:activeTool.gradient,color:"#0D0D1A",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",marginTop:20,opacity:loading?0.7:1}} onClick={generate} disabled={loading}>
            {loading
              ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{width:16,height:16,border:"2px solid #0D0D1A",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Generating…</span>
              :"✦ Generate Now"}
          </button>
          {output && (
            <div style={{marginTop:24,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{...F.mono,fontSize:10,color:"#00E5A0",letterSpacing:"0.12em"}}>✓ GENERATED CONTENT</span>
                <button className="copy-btn" style={{...F.mono,fontSize:10,background:"rgba(245,197,24,0.1)",border:"1px solid rgba(245,197,24,0.2)",color:"#F5C518",padding:"5px 12px",borderRadius:6,cursor:"pointer"}}
                  onClick={()=>{navigator.clipboard.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
                  {copied?"✓ Copied!":"Copy"}
                </button>
              </div>
              <pre style={{fontSize:12,color:"rgba(240,234,214,0.82)",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif",margin:0}}>{output}</pre>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {view==="dashboard" && (
        <div style={{maxWidth:1040,margin:"0 auto",padding:"36px 24px 80px",position:"relative",zIndex:1}}>
          <div style={{marginBottom:32}}>
            <p style={{...F.mono,fontSize:10,color:"#F5C518",letterSpacing:"0.15em",marginBottom:8}}>OWNER DASHBOARD</p>
            <h2 style={{...F.display,fontSize:"clamp(24px,4vw,38px)",marginBottom:6}}>Your Earnings</h2>
            <p style={{fontSize:13,color:"rgba(240,234,214,0.4)"}}>Real-time revenue from all payment channels</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
            {[
              {label:"Total Earned",  value:totalEarned,            icon:"💰",color:"#F5C518",prefix:"₹"},
              {label:"This Month",    value:thisMonth,               icon:"📅",color:"#00E5A0",prefix:"₹"},
              {label:"Transactions",  value:txList.length,           icon:"🧾",color:"#FF4D6D",prefix:""},
              {label:"Avg Per Sale",  value:Math.round(totalEarned/txList.length), icon:"📈",color:"#4895EF",prefix:"₹"},
            ].map(s=>(
              <div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"22px 18px",position:"relative",overflow:"hidden"}}>
                <div className="shimmer-line" style={{position:"absolute",inset:0,pointerEvents:"none"}}/>
                <div style={{fontSize:26,marginBottom:10}}>{s.icon}</div>
                <div style={{...F.display,fontSize:28,color:s.color}}><AnimNum value={s.value} prefix={s.prefix}/></div>
                <div style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.4)",marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:14}}>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"20px 18px"}}>
              <p style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.4)",letterSpacing:"0.1em",marginBottom:18}}>REVENUE BY CHANNEL</p>
              {Object.entries(byMethod).map(([m,a])=>{
                const pct=Math.round(a/totalEarned*100);
                const clr=m==="Razorpay"?"#4895EF":m==="WhatsApp"?"#25D366":"#F5C518";
                return (
                  <div key={m} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5,color:"rgba(240,234,214,0.7)"}}>
                      <span>{m}</span><span style={{color:clr,fontWeight:600}}>{INR(a)} · {pct}%</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                      <div style={{height:6,width:`${pct}%`,background:clr,borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"20px 18px"}}>
              <p style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.4)",letterSpacing:"0.1em",marginBottom:18}}>SALES BY PLAN</p>
              {Object.entries(byPlan).map(([p,c])=>{
                const pct=Math.round(c/txList.length*100);
                const clr=p==="Annual"?"#F5C518":p==="Monthly"?"#00E5A0":"#FF4D6D";
                return (
                  <div key={p} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5,color:"rgba(240,234,214,0.7)"}}>
                      <span>{p}</span><span style={{color:clr,fontWeight:600}}>{c} sales · {pct}%</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                      <div style={{height:6,width:`${pct}%`,background:clr,borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"20px 18px",overflowX:"auto"}}>
            <p style={{...F.mono,fontSize:10,color:"rgba(240,234,214,0.4)",letterSpacing:"0.1em",marginBottom:18}}>RECENT TRANSACTIONS</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  {["ID","Plan","Channel","Amount","Date & Time","Status"].map(h=>(
                    <th key={h} style={{...F.mono,fontSize:9,color:"rgba(240,234,214,0.3)",letterSpacing:"0.08em",padding:"6px 12px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txList.map((tx,i)=>(
                  <tr key={tx.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)",background:i%2===0?"rgba(255,255,255,0.01)":"transparent"}}>
                    <td style={{...F.mono,fontSize:10,padding:"10px 12px",color:"rgba(240,234,214,0.3)"}}>{tx.id}</td>
                    <td style={{padding:"10px 12px",color:"rgba(240,234,214,0.7)"}}>{tx.plan}</td>
                    <td style={{padding:"10px 12px",fontWeight:"bold",color:tx.method==="Razorpay"?"#4895EF":tx.method==="WhatsApp"?"#25D366":"#F5C518"}}>{tx.method}</td>
                    <td style={{padding:"10px 12px",fontWeight:"bold",color:"#00E5A0"}}>{INR(tx.amount)}</td>
                    <td style={{...F.mono,padding:"10px 12px",color:"rgba(240,234,214,0.4)",fontSize:10}}>{tx.date} {tx.time}</td>
                    <td style={{padding:"10px 12px"}}><span style={{...F.mono,fontSize:9,background:"rgba(0,229,160,0.1)",color:"#00E5A0",border:"1px solid rgba(0,229,160,0.2)",padding:"3px 8px",borderRadius:8}}>✓ PAID</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPay && (
        <div style={{position:"fixed",inset:0,background:"rgba(5,5,15,0.88)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowPay(false)}>
          <div style={{background:"#12121F",border:"1px solid rgba(245,197,24,0.15)",borderRadius:24,padding:"28px 24px",maxWidth:420,width:"100%",position:"relative",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}>
            <button style={{position:"absolute",top:14,right:16,background:"transparent",border:"none",color:"rgba(240,234,214,0.3)",fontSize:18,cursor:"pointer"}} onClick={()=>setShowPay(false)}>✕</button>

            {payStatus==="done" ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"20px 0",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,229,160,0.12)",border:"2px solid #00E5A0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✓</div>
                <h3 style={{...F.display,fontSize:22,color:"#F0EAD6"}}>Payment Successful!</h3>
                <p style={{fontSize:13,color:"rgba(240,234,214,0.5)",lineHeight:1.6}}>{payMsg}<br/>WriteAI {selPlan?.label} is now active.</p>
                <button style={{padding:"12px 28px",background:"linear-gradient(135deg,#F5C518,#FF9F1C)",border:"none",borderRadius:12,color:"#0D0D1A",fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}} onClick={()=>setShowPay(false)}>Start Writing →</button>
              </div>
            ) : (
              <>
                <h2 style={{...F.display,fontSize:20,color:"#F0EAD6",marginBottom:12}}>Complete Payment</h2>
                {selPlan && (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(245,197,24,0.06)",border:"1px solid rgba(245,197,24,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:18}}>
                    <div>
                      <div style={{fontSize:13,color:"rgba(240,234,214,0.65)"}}>WriteAI {selPlan.label}</div>
                      <div style={{fontSize:10,...F.mono,color:"#00E5A0",marginTop:2}}>{selPlan.note}</div>
                    </div>
                    <span style={{...F.display,fontSize:22,color:"#F5C518"}}>{INR(selPlan.price)}</span>
                  </div>
                )}
                <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:4,marginBottom:20,gap:2}}>
                  {[{id:"razorpay",l:"⚡ Razorpay"},{id:"upi",l:"📱 UPI / QR"},{id:"whatsapp",l:"💬 WhatsApp"}].map(t=>(
                    <button key={t.id} className="tab-btn" style={{flex:1,padding:"8px 4px",background:payTab===t.id?"rgba(245,197,24,0.12)":"transparent",border:payTab===t.id?"1px solid rgba(245,197,24,0.25)":"1px solid transparent",borderRadius:9,color:payTab===t.id?"#F5C518":"rgba(240,234,214,0.4)",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer"}}
                      onClick={()=>setPayTab(t.id)}>{t.l}</button>
                  ))}
                </div>

                {payTab==="razorpay" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{background:"rgba(72,149,239,0.06)",border:"1px solid rgba(72,149,239,0.15)",borderRadius:14,padding:"16px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{fontSize:22}}>⚡</div>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:"#4895EF",marginBottom:4}}>Razorpay Checkout</div>
                        <div style={{fontSize:12,color:"rgba(240,234,214,0.5)",lineHeight:1.6}}>Accepts UPI, Cards, Net Banking, Wallets & EMI. Auto-verified instantly.</div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                      {["GPay","PhonePe","Paytm","Visa","Mastercard","RuPay","NetBanking","EMI"].map(x=>(
                        <span key={x} style={{...F.mono,fontSize:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 8px",color:"rgba(240,234,214,0.45)"}}>{x}</span>
                      ))}
                    </div>
                    {payStatus==="error" && <div style={{background:"rgba(255,77,109,0.1)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#FF4D6D"}}>{payMsg}</div>}
                    <button style={{width:"100%",padding:14,background:"linear-gradient(135deg,#4895EF,#4361EE)",border:"none",borderRadius:13,color:"white",fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",opacity:payStatus==="processing"?0.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
                      onClick={handleRazorpay} disabled={payStatus==="processing"}>
                      {payStatus==="processing"
                        ?<><span style={{width:16,height:16,border:"2px solid white",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>Opening Razorpay…</>
                        :`Pay ${selPlan?INR(selPlan.price):""} with Razorpay →`}
                    </button>
                    <p style={{...F.mono,fontSize:9,color:"rgba(240,234,214,0.2)",textAlign:"center"}}>Powered by Razorpay · PCI-DSS Compliant · 256-bit SSL</p>
                  </div>
                )}

                {payTab==="upi" && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
                    <div style={{display:"flex",gap:14}}>
                      {[{n:"GPay",c:"#4285F4",i:"G"},{n:"PhonePe",c:"#5F259F",i:"P"},{n:"Paytm",c:"#00BAF2",i:"₹"},{n:"BHIM",c:"#00A859",i:"B"}].map(a=>(
                        <div key={a.n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                          <div style={{width:42,height:42,borderRadius:12,background:a.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:"bold",color:"white"}}>{a.i}</div>
                          <span style={{...F.mono,fontSize:9,color:"rgba(240,234,214,0.35)"}}>{a.n}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"white",borderRadius:16,padding:14,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <QR amount={selPlan?.price}/>
                      <p style={{...F.mono,fontSize:10,color:"#555",margin:0}}>Scan to pay · {selPlan&&INR(selPlan.price)}</p>
                    </div>
                  
                    <button style={{width:"100%",padding:13,background:"#00E5A0",border:"none",borderRadius:12,color:"#0D0D1A",fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}
                      onClick={()=>{addTx("UPI",selPlan.label,selPlan.price);setPayStatus("done");setPayMsg("UPI payment confirmed.");}}>
                      ✓ I've Paid via UPI
                    </button>
                  </div>
                )}

                {payTab==="whatsapp" && (
                  <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#25D366,#128C7E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 8px 24px rgba(37,211,102,0.3)"}}>💬</div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontWeight:600,fontSize:16,color:"#25D366"}}>WhatsApp Pay</div>
                      <div style={{fontSize:12,color:"rgba(240,234,214,0.45)",marginTop:4}}>Send payment directly through WhatsApp</div>
                    </div>
                    <div style={{width:"100%",background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.15)",borderRadius:14,padding:"14px"}}>
                      {[["WhatsApp No.","+91 97177 98541"],["Amount",selPlan?INR(selPlan.price):"—"],["Plan",selPlan?.label||"—"]].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8,color:"rgba(240,234,214,0.6)"}}>
                          <span>{k}</span><span style={{color:"#F0EAD6",fontWeight:600}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <a href={waLink} target="_blank" rel="noreferrer" style={{display:"block",width:"100%",textDecoration:"none"}}>
                      <button style={{width:"100%",padding:13,background:"linear-gradient(135deg,#25D366,#128C7E)",border:"none",borderRadius:12,color:"white",fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>
                        💬 Open WhatsApp to Pay {selPlan&&INR(selPlan.price)}
                      </button>
                    </a>
                    <button style={{width:"100%",padding:12,background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:12,color:"#25D366",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}
                      onClick={()=>{addTx("WhatsApp",selPlan.label,selPlan.price);setPayStatus("done");setPayMsg("WhatsApp payment confirmed.");}}>
                      ✓ I've Sent Payment — Confirm
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const font = {
  display:  {fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700},
  brand:    {fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18,color:"#F0EAD6"},
  mono:     {fontFamily:"'IBM Plex Mono',monospace",fontWeight:400},
  base:     {fontFamily:"'DM Sans',sans-serif",fontWeight:400},
  semibold: {fontFamily:"'DM Sans',sans-serif",fontWeight:600},
};
