import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Building2, CheckCircle2, CircleDollarSign, CreditCard, Package, Settings, ShieldCheck, TrendingUp, Users } from "lucide-react"
import { platform } from "../../api/api"
import { money } from "../../utils/helpers"
import "../../styles/platform.css"

const actions=[
  ["/platform/gyms",Building2,"Manage gyms","Tenants, owners & access"],
  ["/platform/subscriptions",ShieldCheck,"Subscriptions","Plans, billing & status"],
  ["/platform/revenue",CircleDollarSign,"Platform revenue","GB SaaS income"],
  ["/platform/plans",Package,"SaaS plans","Pricing & limits"],
]
export default function Dashboard(){
  const [stats,setStats]=useState({}),[loading,setLoading]=useState(true);const navigate=useNavigate()
  useEffect(()=>{let live=true;platform.dashboard().then(d=>{if(live)setStats(d?.stats||{})}).catch(()=>{}).finally(()=>live&&setLoading(false));return()=>{live=false}},[])
  const val=(key)=>loading?"—":key==="totalRevenue"?money(stats[key]||0):stats[key]||0
  return <div className="platform-page"><div className="platform-wrap">
    <div className="platform-head"><div><div className="platform-eyebrow"><i/>GB CONTROL CENTER</div><h1>Platform Dashboard</h1><p>One command center for every gym, subscription and naira earned by GB.</p></div></div>
    <section className="platform-hero"><div className="platform-hero-content"><div className="platform-eyebrow"><i/>PLATFORM OWNER</div><h2>Run the GB fitness network from one place.</h2><p>Monitor tenant activity, manage SaaS access, control pricing and keep platform revenue completely separate from individual gym revenue.</p><div className="platform-hero-actions"><button className="p-btn primary" onClick={()=>navigate("/platform/gyms")}>View gyms <ArrowRight size={15}/></button><button className="p-btn" onClick={()=>navigate("/platform/revenue")}>View revenue <TrendingUp size={15}/></button></div></div></section>
    <div className="platform-stats">
      <Stat icon={Building2} label="Total gyms" value={val("gyms")} sub="Registered tenants"/>
      <Stat icon={CheckCircle2} label="Active gyms" value={val("activeGyms")} sub="Currently enabled"/>
      <Stat icon={ShieldCheck} label="Active SaaS" value={val("activeSubscriptions")} sub="Active + trial subscriptions"/>
      <Stat icon={CircleDollarSign} label="SaaS revenue" value={val("totalRevenue")} sub="Verified GB payments" yellow/>
    </div>
    <div className="platform-grid"><section className="p-panel"><div className="p-panel-head"><div><h3 className="p-panel-title">Quick management</h3><p className="p-panel-desc">Jump directly into the areas you use most.</p></div></div><div className="p-action-grid">{actions.map(([to,Icon,title,desc])=><button className="p-action" key={to} onClick={()=>navigate(to)}><span className="p-action-main"><span className="p-action-icon"><Icon size={18}/></span><span><b>{title}</b><span>{desc}</span></span></span><ArrowRight size={15}/></button>)}</div></section>
      <section className="p-panel"><div className="p-panel-head"><div><h3 className="p-panel-title">Platform health</h3><p className="p-panel-desc">High-level operating status.</p></div></div><div className="p-health"><Health label="Tenant isolation" status="Protected"/><Health label="SaaS billing" status="Paystack"/><Health label="Platform revenue" status="GB only"/><Health label="Access control" status="Role based"/></div></section></div>
  </div></div>
}
function Stat({icon:Icon,label,value,sub,yellow}){return <div className={`p-stat ${yellow?"yellow":""}`}><div className="p-stat-icon"><Icon size={20}/></div><div className="p-stat-label">{label}</div><div className="p-stat-value">{value}</div><div className="p-stat-sub">{sub}</div></div>}
function Health({label,status}){return <div className="p-health-row"><span className="p-health-left"><i className="p-dot"/>{label}</span><strong>{status}</strong></div>}
