import { getStore, getDeployStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const defaults={
  bonus:{cost:37000,target:70,eqKg:15,net:.76,shares:[.55,.50,.40,.30],scale:{3:1,4:1.02,5:1.04,6:1.06,7:1.08,8:1.10,9:1.12},thresholdKg:{3:[1500,1650,2265,2610,3120],4:[1995,2205,3015,3480,4185],5:[2505,2745,3750,4335,5205],6:[2850,3135,3900,4500,5400],7:[3330,3855,4545,5250,6300],8:[3795,4395,5205,6000,7200],9:[4275,4950,5850,6750,8100]}},
  products:[{id:'original15',name:'Pack 15 kg',tag:'Original',kg:15,bonus:true},{id:'original12',name:'Pack 12 kg',tag:'Original',kg:12,bonus:true},{id:'mini15',name:'Pack 15 kg',tag:'Mini',kg:15,bonus:true},{id:'saco20',name:'Saco 20 kg',tag:'Reserva',kg:20,bonus:false}]
};
const SCHEMA_VERSION=3;
const PIN_HASH='20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a';

function isProduction(req){
  const ctx=Netlify.context?.deploy?.context||Netlify.env.get('CONTEXT')||'';
  if(ctx) return ctx==='production';
  try{return new URL(req.url).hostname==='camino-al-bono-theice.netlify.app'}catch{return false}
}
function storeFor(req){
  return isProduction(req)
    ? getStore('camino-config',{consistency:'strong'})
    : getDeployStore('camino-config');
}
async function readCurrent(req){
  const primary=storeFor(req);
  let data=await primary.get('current',{type:'json'});
  if(isProduction(req)&&!data){
    try{
      const legacy=getDeployStore('camino-config');
      const old=await legacy.get('current',{type:'json'});
      if(old){await primary.setJSON('current',old);data=old}
    }catch(e){}
  }
  if(data&&Number(data.schemaVersion||0)<SCHEMA_VERSION){
    data={...data,schemaVersion:SCHEMA_VERSION,bonus:{...defaults.bonus,...(data.bonus||{}),target:70,net:.76},updatedAt:Date.now()};
    await primary.setJSON('current',data);
  }
  return {primary,data};
}
function authorized(req){
  const pin=String(req.headers.get('x-config-pin')||'');
  const got=createHash('sha256').update(pin).digest('hex');
  return timingSafeEqual(Buffer.from(got,'hex'),Buffer.from(PIN_HASH,'hex'));
}

export default async (req)=>{
  if(req.method==='GET'){
    const {data}=await readCurrent(req);
    return Response.json(data?{...data,initialized:true}:{...defaults,schemaVersion:SCHEMA_VERSION,initialized:false},{headers:{'cache-control':'no-store'}});
  }
  if(req.method==='POST'){
    if(!authorized(req))return new Response('No autorizado',{status:403});
    const url=new URL(req.url);
    if(url.searchParams.get('verify')==='1')return Response.json({ok:true});
    let body;try{body=await req.json()}catch{return new Response('JSON inválido',{status:400})}
    if(!body||!body.bonus||!Array.isArray(body.products))return new Response('Configuración inválida',{status:400});
    const primary=storeFor(req);
    const data={schemaVersion:SCHEMA_VERSION,bonus:body.bonus,products:body.products,updatedAt:Date.now()};
    await primary.setJSON('current',data);
    return Response.json({ok:true,updatedAt:data.updatedAt});
  }
  return new Response('Method not allowed',{status:405});
};

export const config={path:'/api/config'};
