-- 044: depuración del grupo "hombros". APLICADA el 2026-10-08. 103 -> 94.

begin;

create temp table _m(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _m(old_id, new_id) values
  -- El press militar con barra estaba escrito cuatro veces. "Overhead press" y
  -- "press militar" son el mismo ejercicio.
  (1440, 418), (687, 418), (1893, 418),
  (82, 829),      -- "Elevaciones Posteriores" -> "Elevación Deltoides Posterior"
  (142, 1729),    -- rotación externa en polea
  (1429, 1715),   -- rotación externa con mancuerna
  (917, 1745),    -- elevación frontal en polea
  (1753, 1807),   -- elevación lateral en polea por detrás
  (351, 1443);    -- elevación lateral + frontal combinada

update workout_sets ws set exercise_id = m.new_id::text
  from _m m where ws.exercise_id = m.old_id::text;

update workout_templates t set exercises = (
  select jsonb_agg(
    case when (e->>'exerciseId') in (select old_id::text from _m)
      then jsonb_set(e, '{exerciseId}',
             to_jsonb((select new_id::text from _m where old_id::text = e->>'exerciseId')))
      else e end
    order by ord)
  from jsonb_array_elements(t.exercises) with ordinality x(e, ord))
where exists (select 1 from jsonb_array_elements(t.exercises) e
              where (e->>'exerciseId') in (select old_id::text from _m));

update exercises set is_active = false, updated_at = now()
 where id in (select old_id from _m);

update exercises set name = 'Press Militar con Barra',                updated_at = now() where id = 418;
update exercises set name = 'Rotación Externa de Hombro en Polea',    updated_at = now() where id = 1729;
update exercises set name = 'Rotación Externa de Hombro con Mancuerna', updated_at = now() where id = 1715;
update exercises set name = 'Elevación Frontal en Polea',             updated_at = now() where id = 1745;
update exercises set name = 'Elevación Lateral en Polea por Detrás',  updated_at = now() where id = 1807;
update exercises set name = 'Elevación Lateral y Frontal con Mancuernas', updated_at = now() where id = 1443;

-- #478 se llama "con mancuernas" pero estaba clasificado como peso corporal.
-- La 042 solo reclasificaba a polea y máquina, así que este se quedó fuera.
update exercises set equipment_category = 'dumbbell', updated_at = now() where id = 478;

commit;
