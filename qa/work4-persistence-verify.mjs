import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const baseUrl = (process.env.WORK4_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SEED_DEVELOPMENT_EMAIL ?? "minh@example.com";
const password = process.env.SEED_DEVELOPMENT_PASSWORD ?? "demo1234";
const orderId = process.env.WORK4_EXPECT_ORDER;
const ticketId = process.env.WORK4_EXPECT_TICKET;
const depositId = process.env.WORK4_EXPECT_DEPOSIT;
const phone = process.env.WORK4_EXPECT_PHONE;
if (!orderId || !ticketId || !depositId || !phone) {
  console.error("Set WORK4_EXPECT_ORDER, WORK4_EXPECT_TICKET, WORK4_EXPECT_DEPOSIT, and WORK4_EXPECT_PHONE to values produced before restarting Next.js.");
  process.exit(1);
}
const jar = new Map();
function cookies(response) { for (const h of response.headers.getSetCookie?.() ?? []) { const p=h.split(";",1)[0]; const i=p.indexOf("="); if(i>0) jar.set(p.slice(0,i),p.slice(i+1)); } }
function cookieHeader(){ return [...jar].map(([k,v])=>`${k}=${v}`).join("; "); }
async function request(path, init={}) { const headers=new Headers(init.headers??{}); if(jar.size) headers.set("Cookie",cookieHeader()); const response=await fetch(`${baseUrl}${path}`,{...init,headers,redirect:"manual"}); cookies(response); return response; }
const csrf=await request("/api/auth/csrf"); const csrfJson=await csrf.json();
const body=new URLSearchParams({csrfToken:csrfJson.csrfToken,email,password,callbackUrl:"/dashboard",json:"true"});
const signed=await request("/api/auth/callback/credentials",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body.toString()});
if(![200,302,303].includes(signed.status)) throw new Error(`Sign-in failed: ${signed.status}`);
for (const [label,path] of [["order",`/api/v1/orders/${encodeURIComponent(orderId)}`],["ticket",`/api/v1/support/tickets/${encodeURIComponent(ticketId)}`]]) {
  const response=await request(path); const payload=await response.json().catch(()=>({}));
  if(response.status!==200) throw new Error(`${label} persistence failed after restart: ${response.status} ${JSON.stringify(payload)}`);
}
const depositsResponse = await request("/api/v1/deposits");
const depositsPayload = await depositsResponse.json().catch(() => ({}));
if (depositsResponse.status !== 200 || !depositsPayload.data?.some((item) => item.id === depositId)) {
  throw new Error(`deposit persistence failed after restart: ${depositsResponse.status} ${JSON.stringify(depositsPayload)}`);
}
const profileResponse = await request("/api/v1/me");
const profilePayload = await profileResponse.json().catch(() => ({}));
if (profileResponse.status !== 200 || profilePayload.data?.phone !== phone) {
  throw new Error(`profile persistence failed after restart: ${profileResponse.status} ${JSON.stringify(profilePayload)}`);
}
console.log(`Persistence after Next.js restart confirmed for order ${orderId}, deposit ${depositId}, ticket ${ticketId}, and profile phone ${phone}.`);
