import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

const defaults={
  bonus:{cost:37000,target:72,eqKg:15,net:.72,shares:[.55,.50,.40,.30],scale:{3:1,4:1,5:1,6:1,7:1,8:1,9:1},thresholdKg:{3:[1500,1650,2265,2610,3120],4:[2000,2200,3020,3480,4160],5:[2500,2750,3775,4350,5200],6:[3000,3300,4530,5220,6240],7:[3500,3850,5285,6090,7280],8:[4000,4400,6040,6960,8320],9:[4500,4950,6795,7830,9360]}},
  products:[{id:'original15',name:'Pack 15 kg',tag:'Original',kg:15,bonus:true},{id:'original12',name:'Pack 12 kg',tag:'Original',kg:12,bonus:true},{id:'mini15',name:'Pack 15 kg',tag:'Mini',kg:15,bonus:true},{id:'saco20',name:'Saco 20 kg',tag:'Reserva',kg:20,bonus:false}]
};
const SCHEMA_VERSION=4;
const PIN_HASH='20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a';

function store(){return getStore('camino-config',{consistency:'strong'})}
async function readCurrent(){
  const primary=store();let data=await primary.get('current',{type:'json'});
  if(data&&Number(data.schemaVersion||0)<SCHEMA_VERSION){
    data={...data,schemaVersion:SCHEMA_VERSION,bonus:{...defaults.bonus,...(data.bonus||{}),target:72,net:.72,scale:defaults.bonus.scale,thresholdKg:defaults.bonus.thresholdKg},updatedAt:Date.now()};
    await primary.setJSON('current',data);
  }
  return{primary,data};
}
function authorized(req){
  const pin=String(req.headers.get('x-config-pin')||'');
  const got=createHash('sha256').update(pin).digest('hex');
  return timingSafeEqual(Buffer.from(got,'hex'),Buffer.from(PIN_HASH,'hex'));
}

export default async (req)=>{
  if(req.method==='GET'){
    const {data}=await readCurrent();
    return Response.json(data?{...data,initialized:true}:{...defaults,schemaVersion:SCHEMA_VERSION,initialized:false},{headers:{'cache-control':'no-store'}});
  }
  if(req.method==='POST'){
    if(!authorized(req))return new Response('No autorizado',{status:403});
    const url=new URL(req.url);if(url.searchParams.get('verify')==='1')return Response.json({ok:true});
    let body;try{body=await req.json()}catch{return new Response('JSON inválido',{status:400})}
    if(!body||!body.bonus||!Array.isArray(body.products))return new Response('Configuración inválida',{status:400});
    const primary=store();const data={schemaVersion:SCHEMA_VERSION,bonus:body.bonus,products:body.products,updatedAt:Date.now()};
    await primary.setJSON('current',data);return Response.json({ok:true,updatedAt:data.updatedAt});
  }
  return new Response('Method not allowed',{status:405});
};

export const config={path:'/api/config'};
