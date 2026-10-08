-- 045: depuración de pecho, biceps, abdomen y renombrados del resto.
-- APLICADA el 2026-10-08.
--
-- Cierra la pasada por grupo muscular. Triceps, pantorrillas, antebrazos,
-- cardio y gluteos no tenían duplicados reales: lo que el agrupador marcó son
-- variantes legítimas (por accesorio de polea, por posición o por lateralidad).

begin;

create temp table _m(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _m(old_id, new_id) values
  -- pecho
  (1918, 129),              -- "Legend Pecho Press" era una marca de máquina
  (537, 1277), (1444, 1277),-- press inclinado con mancuernas, escrito 3 veces
  (1508, 925),              -- press inclinado en multipower
  (135, 926),               -- aperturas en máquina
  (237, 924),               -- cruce de poleas
  -- biceps
  (1012, 1192),             -- curl alterno con mancuernas
  (1931, 92),               -- "Curl con Mancuernas" generico
  (1531, 95),               -- curl en polea
  -- abdomen
  (577, 1188);              -- flexión lateral con mancuernas

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

-- #1012 era el smart_enabled del par; #1192 tiene el uso (46 series).
update exercises set smart_enabled = true, updated_at = now() where id = 1192;

-- #924 NO hereda la imagen de #237: esa foto es un cruce en banco inclinado
-- (Incline-cable-flyes), no el cruce de poleas de pie. Mismo caso que #83.

-- Nombres en español de los supervivientes que lo necesitaban.
update exercises set name = 'Aperturas Inclinadas con Mancuernas',            updated_at = now() where id = 308;
update exercises set name = 'Press de Banca con Agarre Cerrado',              updated_at = now() where id = 1897;
update exercises set name = 'Press de Banca Inclinado con Agarre Cerrado',    updated_at = now() where id = 1467;
update exercises set name = 'Press con Mancuernas Agarre Cerrado',            updated_at = now() where id = 1228;
update exercises set name = 'Press de Pecho Declinado en Máquina',            updated_at = now() where id = 1831;
update exercises set name = 'Press Inclinado en Multipower',                  updated_at = now() where id = 925;
update exercises set name = 'Curl de Bíceps Alterno con Mancuernas',          updated_at = now() where id = 1192;
update exercises set name = 'Curl de Bíceps con Mancuernas Agarre Ancho',     updated_at = now() where id = 1225;
update exercises set name = 'Curl y Press con Mancuernas',                    updated_at = now() where id = 1226;
update exercises set name = 'Curl con Mancuernas Acostado',                   updated_at = now() where id = 1530;
update exercises set name = 'Curl Cheat con Mancuernas',                      updated_at = now() where id = 1482;
update exercises set name = 'Drag Curl con Mancuernas',                       updated_at = now() where id = 1224;
update exercises set name = 'Extensión de Tríceps sobre la Cabeza en Polea',  updated_at = now() where id = 1513;
update exercises set name = 'Extensión de Tríceps sobre la Cabeza en Polea a una Mano', updated_at = now() where id = 1668;
update exercises set name = 'Extensión de Tríceps sobre la Cabeza con Barra', updated_at = now() where id = 1519;
update exercises set name = 'Extensión de Tríceps Acostado',                  updated_at = now() where id = 1480;
update exercises set name = 'Extensión de Tríceps con TRX',                   updated_at = now() where id = 1266;
update exercises set name = 'Puente de Glúteos con Press Unilateral',         updated_at = now() where id = 1686;

commit;
