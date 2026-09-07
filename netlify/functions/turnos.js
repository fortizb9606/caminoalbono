import { getStore, getDeployStore } from '@netlify/blobs';

function store(){
  return Netlify.env.get('CONTEXT')==='production'
    ? getStore('camino-turnos',{consistency:'strong'})
    : getDeployStore('camino-turnos');
}

export default async (req)=>{
  const s=store();
  const url=new URL(req.url);
  if(req.method==='GET'){
    const {blobs}=await s.list();
    const rows=[];
    for(const b of blobs){
      const r=await s.get(b.key,{type:'json'});
      if(r)rows.push(r);
    }
    rows.sort((a,b)=>(a.ts||0)-(b.ts||0));
    return Response.json(rows,{headers:{'cache-control':'no-store'}});
  }
  if(req.method==='POST'){
    let body;try{body=await req.json()}catch{return new Response('JSON inválido',{status:400})}
    if(!body||!body.ts)return new Response('Turno inválido',{status:400});
    await s.setJSON(String(body.ts),body);
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
