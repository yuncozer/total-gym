const U = process.env.NEXT_PUBLIC_SUPABASE_URL, K = process.env.SUPABASE_SERVICE_ROLE_KEY
const q = async (sql) => {
  const r = await fetch(`${U}/rest/v1/rpc/exec_sql`, { method:'POST', headers:{apikey:K,Authorization:`Bearer ${K}`,'Content-Type':'application/json'}, body: JSON.stringify({q:sql}) })
  return r.ok ? r.json() : null
}
// Sin RPC arbitraria: contamos con PostgREST directo.
const out = {}
let from = 0
for(;;){
  const r = await fetch(`${U}/rest/v1/workout_sets?select=exercise_id`, { headers:{apikey:K,Authorization:`Bearer ${K}`,Range:`${from}-${from+999}`} })
  const d = await r.json()
  d.forEach(s => { const k=s.exercise_id; if(k) (out[k] ??= {sets:0,tpl:0}).sets++ })
  if (d.length < 1000) break
  from += 1000
}
const rt = await fetch(`${U}/rest/v1/workout_templates?select=exercises`, { headers:{apikey:K,Authorization:`Bearer ${K}`} })
for (const t of await rt.json()) for (const e of (t.exercises||[])) { const k=String(e.exerciseId??''); if(k) (out[k] ??= {sets:0,tpl:0}).tpl++ }
const fs=await import('node:fs');fs.default.writeFileSync('uso.json',JSON.stringify(out));//('fs').writeFileSync('uso.json', JSON.stringify(out))
console.log('ids con uso:', Object.keys(out).length)
