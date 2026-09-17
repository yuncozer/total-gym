import fs from 'node:fs'
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const COLS = 'id,name,category,equipment,equipment_category,muscle_group_id,image_url,images,is_active,smart_enabled,variation_group'
let all = []
for (let from = 0; ; from += 1000) {
  const res = await fetch(`${URL_}/rest/v1/exercises?select=${COLS}&order=id`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` }
  })
  if (!res.ok) throw new Error(res.status + ' ' + await res.text())
  const data = await res.json()
  all = all.concat(data)
  if (data.length < 1000) break
}
fs.writeFileSync('ours.json', JSON.stringify(all))
console.log('filas:', all.length)
all.filter(e => e.is_active).slice(0, 12).forEach(e =>
  console.log(` ${String(e.id).padEnd(6)} ${(e.name||'').slice(0,50).padEnd(52)} ${e.muscle_group_id||'-'} img:${e.image_url?'si':'NO'}`))
