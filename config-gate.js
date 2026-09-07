(function(){
'use strict';
const AK='theIceConfigAccessV1';
const PIN_HASH='20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a';
sessionStorage.removeItem(AK);
function unlocked(){return !!sessionStorage.getItem(AK)}
async function sha256(text){
  const data=new TextEncoder().encode(String(text||''));
  const buf=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function verify(pin){
  try{return (await sha256(pin))===PIN_HASH}catch(e){return false}
}
document.addEventListener('click',async e=>{
  const back=e.target&&e.target.closest?e.target.closest('#bcBack'):null;
  if(back){sessionStorage.removeItem(AK);return}
  const b=e.target&&e.target.closest?e.target.closest('#bonusCfgBtn'):null;
  if(!b||unlocked())return;
  e.preventDefault();e.stopImmediatePropagation();
  const pin=prompt('Código de acceso a Configuración');
  if(pin===null)return;
  if(await verify(pin)){
    sessionStorage.setItem(AK,String(pin));
    setTimeout(()=>b.click(),0);
  }else alert('Código incorrecto.');
},true);
window.THE_ICE_CONFIG_PIN=()=>sessionStorage.getItem(AK)||'';
})();
