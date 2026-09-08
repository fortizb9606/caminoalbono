(function(){
'use strict';
const BK='theIceBonusConfigV3',PK='theIceProductsV1',SK='theIceCentralConfigSeenV1';
let pendingSave=false;
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch{return false}}
async function pull(autoReload=false){try{
  const r=await fetch('/api/config',{cache:'no-store'});if(!r.ok)return;
  const c=await r.json();if(c.initialized===false)return;
  let oldBonus=null,oldProducts=null;
  try{oldBonus=JSON.parse(localStorage.getItem(BK)||'null')}catch(e){}
  try{oldProducts=JSON.parse(localStorage.getItem(PK)||'null')}catch(e){}
  const changed=(c.bonus&&!same(oldBonus,c.bonus))||(Array.isArray(c.products)&&!same(oldProducts,c.products));
  if(c.bonus){localStorage.setItem(BK,JSON.stringify(c.bonus));window.BONUS_CFG=c.bonus}
  if(Array.isArray(c.products)){localStorage.setItem(PK,JSON.stringify(c.products));window.THE_ICE_PRODUCTS=c.products}
  window.dispatchEvent(new CustomEvent('theicecentralconfig',{detail:c}));
  if(autoReload&&changed){
    const stamp=String(c.updatedAt||'central');
    if(sessionStorage.getItem(SK)!==stamp){sessionStorage.setItem(SK,stamp);location.reload()}
  }
}catch(e){}}
async function push(){try{
  const bonus=JSON.parse(localStorage.getItem(BK)||'null')||window.BONUS_CFG;
  const products=JSON.parse(localStorage.getItem(PK)||'null')||window.THE_ICE_PRODUCTS||[];
  const pin=window.THE_ICE_CONFIG_PIN?window.THE_ICE_CONFIG_PIN():'';
  if(!bonus||!products.length||!pin)return false;
  const r=await fetch('/api/config',{method:'POST',headers:{'content-type':'application/json','x-config-pin':pin},body:JSON.stringify({bonus,products}),keepalive:true});
  if(r.ok){pendingSave=false;try{const out=await r.clone().json();if(out.updatedAt)sessionStorage.setItem(SK,String(out.updatedAt))}catch(e){}}
  return r.ok
}catch(e){return false}}
window.THE_ICE_PULL_CONFIG=pull;window.THE_ICE_PUSH_CONFIG=push;
document.addEventListener('click',e=>{if(e.target&&e.target.id==='bcSave'){pendingSave=true;queueMicrotask(()=>push())}},true);
window.addEventListener('pagehide',()=>{if(pendingSave)push()});
setTimeout(()=>pull(true),0);
})();
