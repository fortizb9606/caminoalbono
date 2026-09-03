(function(){
'use strict';
const BK='theIceBonusConfigV3',PK='theIceProductsV1';
async function pull(){
  try{
    const r=await fetch('/api/config',{cache:'no-store'});if(!r.ok)return;
    const c=await r.json();
    if(c.bonus){localStorage.setItem(BK,JSON.stringify(c.bonus));window.BONUS_CFG=c.bonus}
    if(Array.isArray(c.products)){localStorage.setItem(PK,JSON.stringify(c.products));window.THE_ICE_PRODUCTS=c.products}
    window.dispatchEvent(new CustomEvent('theicecentralconfig',{detail:c}));
  }catch(e){}
}
async function push(){
  try{
    const bonus=JSON.parse(localStorage.getItem(BK)||'null')||window.BONUS_CFG;
    const products=JSON.parse(localStorage.getItem(PK)||'null')||window.THE_ICE_PRODUCTS||[];
    if(!bonus||!products.length)return false;
    const r=await fetch('/api/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bonus,products})});
    return r.ok;
  }catch(e){return false}
}
window.THE_ICE_PULL_CONFIG=pull;window.THE_ICE_PUSH_CONFIG=push;
document.addEventListener('DOMContentLoaded',()=>{pull().then(()=>{if(location.search.includes('admin=1'))setTimeout(()=>location.reload(),50)})},{once:true});
})();
