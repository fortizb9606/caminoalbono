(function(){
'use strict';
const BK='theIceBonusConfigV3',PK='theIceProductsV1',SK='theIceCentralConfigSeenV1';
function same(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch{return false}}
function clone(o){return JSON.parse(JSON.stringify(o))}
function migrateOldBonus(c){
  if(c&&Number(c.target)===72&&Math.abs(Number(c.net)-.72)<.0001){c={...c,target:70,net:.76}}
  return c;
}
function readBonusFromForm(){
  const c=clone(window.BONUS_CFG||JSON.parse(localStorage.getItem(BK)||'{}'));
  const g=id=>document.getElementById(id);
  if(!g('bcCost'))return c;
  c.cost=Math.max(0,+g('bcCost').value||0);
  c.target=Math.max(0,+g('bcTarget').value||0);
  c.net=Math.max(0,Math.min(1,(+g('bcNet').value||0)/100));
  c.eqKg=Math.max(1,+g('bcEq').value||15);
  c.shares=[0,1,2,3].map(i=>Math.max(0,Math.min(1,(+g('bcSN'+i).value||0)/100)));
  c.scale=c.scale||{};c.thresholdKg=c.thresholdKg||{};
  for(let p=3;p<=9;p++){
    c.scale[p]=Math.max(.5,Math.min(2,(+g(`bcF-${p}`).value||100)/100));
    c.thresholdKg[p]=[0,1,2,3,4].map(i=>Math.max(1,+g(`bcG-${p}-${i}`).value||1));
  }
  return c;
}
function readProductsFromForm(){
  const rows=[...document.querySelectorAll('.pcProductRow')];
  if(!rows.length)return window.THE_ICE_PRODUCTS||JSON.parse(localStorage.getItem(PK)||'[]');
  return rows.map((r,i)=>({
    id:r.dataset.id||('producto-'+i),
    name:r.querySelector('[data-f=name]')?.value||('Producto '+(i+1)),
    tag:r.querySelector('[data-f=tag]')?.value||'',
    kg:+(r.querySelector('[data-f=kg]')?.value||1),
    bonus:!!r.querySelector('[data-f=bonus]')?.checked
  }));
}
function validBonus(c){
  for(let p=3;p<=9;p++)for(let i=1;i<5;i++)if(c.thresholdKg[p][i]<=c.thresholdKg[p][i-1])return p;
  return 0;
}
async function pull(autoReload=false){try{
  const r=await fetch('/api/config',{cache:'no-store'});if(!r.ok)return false;
  const c=await r.json();if(c.initialized===false)return false;
  if(c.bonus)c.bonus=migrateOldBonus(c.bonus);
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
  return true;
}catch(e){return false}}
async function push(bonus,products){try{
  bonus=migrateOldBonus(bonus||JSON.parse(localStorage.getItem(BK)||'null')||window.BONUS_CFG);
  products=products||JSON.parse(localStorage.getItem(PK)||'null')||window.THE_ICE_PRODUCTS||[];
  const pin=window.THE_ICE_CONFIG_PIN?window.THE_ICE_CONFIG_PIN():'';
  if(!bonus||!products.length||!pin)return false;
  const r=await fetch('/api/config',{method:'POST',headers:{'content-type':'application/json','x-config-pin':pin},body:JSON.stringify({bonus,products}),cache:'no-store'});
  if(!r.ok)return false;
  let out=null;try{out=await r.json();if(out.updatedAt)sessionStorage.setItem(SK,String(out.updatedAt))}catch(e){}
  const check=await fetch('/api/config',{cache:'no-store'});if(!check.ok)return false;
  const saved=await check.json();
  if(!saved.bonus||!same(migrateOldBonus(saved.bonus),bonus))return false;
  return true;
}catch(e){return false}}
window.THE_ICE_PULL_CONFIG=pull;window.THE_ICE_PUSH_CONFIG=push;
function mountSave(){
  const btn=document.getElementById('bcSave');if(!btn||btn.dataset.centralStrong==='1')return;
  btn.dataset.centralStrong='1';
  btn.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const bonus=migrateOldBonus(readBonusFromForm());
    const bad=validBonus(bonus);if(bad){alert(`Revisa ${bad} personas: cada nivel debe ser mayor al anterior.`);return}
    const products=readProductsFromForm();
    localStorage.setItem(BK,JSON.stringify(bonus));window.BONUS_CFG=bonus;
    if(window.THE_ICE_SAVE_PRODUCTS)window.THE_ICE_SAVE_PRODUCTS(products);else{localStorage.setItem(PK,JSON.stringify(products));window.THE_ICE_PRODUCTS=products}
    const old=btn.textContent;btn.disabled=true;btn.textContent='Guardando en servidor…';
    const ok=await push(bonus,products);
    if(!ok){btn.disabled=false;btn.textContent=old;alert('No se pudo confirmar la configuración central. No se recargó la página para evitar perder cambios.');return}
    btn.textContent='Guardado ✓';
    setTimeout(()=>location.reload(),250);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSave);else mountSave();
new MutationObserver(mountSave).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>pull(true),0);
})();
