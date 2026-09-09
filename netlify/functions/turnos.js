import { getStore, getDeployStore } from '@netlify/blobs';

function isProduction(req){
  const ctx=Netlify.context?.deploy?.context||Netlify.env.get('CONTEXT')||'';
  if(ctx)return ctx==='production';
  try{return new URL(req.url).hostname==='camino-al-bono-theice.netlify.app'}catch{return false}
}
function storeFor(req){
  return isProduction(req)
    ? getStore('camino-turnos',{consistency:'strong'})
    : getDeployStore('camino-turnos');
}
async function migrateCurrentDeploy(req,primary){
  if(!isProduction(req))return;
  try{
    const legacy=getDeployStore('camino-turnos');
    const {blobs}=await legacy.list();
    for(const b of blobs){
      const exists=await primary.get(b.key,{type:'json'});
      if(exists)continue;
      const row=await legacy.get(b.key,{type:'json'});
      if(row)await primary.setJSON(b.key,row);
    }
  }catch(e){}
}
async function rowsFrom(store){
  const {blobs}=await store.list();
  const rows=[];
  for(const b of blobs){
    const r=await store.get(b.key,{type:'json'});
    if(r)rows.push(r);
  }
  rows.sort((a,b)=>(a.ts||0)-(b.ts||0));
  return rows;
}

export default async (req)=>{
  const s=storeFor(req);
  const url=new URL(req.url);
  if(req.method==='GET'){
    await migrateCurrentDeploy(req,s);
    return Response.json(await rowsFrom(s),{headers:{'cache-control':'no-store'}});
  }
  if(req.method==='POST'){
    let body;try{body=await req.json()}catch{return new Response('JSON inválido',{status:400})}
    if(!body||!body.ts)return new Response('Turno inválido',{status:400});
    const key=String(body.ts);
    const existing=await s.get(key,{type:'json'});
    const merged=existing?{...existing,...body,finalInventory:body.finalInventory||existing.finalInventory}:body;
    await s.setJSON(key,merged);
    return Response.json({ok:true,ts:body.ts});
  }
  if(req.method==='DELETE'){
    const ts=url.searchParams.get('ts');
    if(!ts)return new Response('Falta ts',{status:400});
    await s.delete(String(ts));
    return Response.json({ok:true});
  }
  return new Response('Method not allowed',{status:405});
};

export const config={path:'/api/turnos'};
