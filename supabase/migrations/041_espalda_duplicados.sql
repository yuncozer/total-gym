-- 041: depuración del grupo "espalda". APLICADA el 2026-10-08. 124 -> 104.
--
-- Criterio de superviviente, el mismo de la 036 y la 040: más uso real >
-- smart_enabled > tiene imagen. El superviviente hereda la imagen y el
-- smart_enabled del grupo, para no perder la única foto buena por quedarnos
-- con la fila más usada.
--
-- Las absorbidas se DESACTIVAN, no se borran: reversible, y el historial se
-- repunta al superviviente, así que no se pierde ni una serie.

begin;

create temp table _m(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _m(old_id, new_id) values
  -- Jalón al pecho: 14 filas para 4 variantes reales de agarre.
  (1510, 1136),                                  -- neutro
  (1124, 258), (1702, 258), (723, 258), (1695, 258),  -- ancho
  (1126, 158), (259, 158),                       -- cerrado
  (1125, 1127),                                  -- supino
  -- Fusiones claras: mismo ejercicio escrito de dos formas.
  (513, 919),                                    -- Remo en T
  (152, 154),                                    -- Dominadas supinas
  (1143, 301), (1348, 301),                      -- Extensión de espalda
  (1698, 83),                                    -- Remo inclinado con barra
  (310, 81),                                     -- Remo con mancuernas
  (1186, 1637), (1701, 1637),                    -- Remo unilateral
  (1659, 1972),                                  -- Jalón unilateral
  (1908, 636), (1455, 636);                      -- Superman

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

-- Nombre ambiguo y sin uso; no es una variante que podamos describir.
update exercises set is_active = false, updated_at = now() where id = 354;

-- Herencias: lo que el superviviente debe quedarse de las absorbidas.
--   #919 no tenía imagen; #513 sí, y es la correcta (T-bar-row).
update exercises set image_url = 'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
                     updated_at = now() where id = 919;
--   #154 tiene el uso y la imagen; #152 era el smart_enabled.
update exercises set smart_enabled = true, updated_at = now() where id = 154;
--   #1136 tiene el uso y la imagen; #1510 era el smart_enabled.
update exercises set smart_enabled = true, updated_at = now() where id = 1136;

-- Nombres definitivos.
update exercises set name = 'Jalón al Pecho con Agarre Neutro', updated_at = now() where id = 1136;
update exercises set name = 'Jalón al Pecho con Agarre Ancho',  updated_at = now() where id = 258;
update exercises set name = 'Jalón al Pecho con Agarre Supino', updated_at = now() where id = 1127;
update exercises set name = 'Remo en Barra T',                  updated_at = now() where id = 919;
update exercises set name = 'Dominadas con Agarre Supino',      updated_at = now() where id = 154;
update exercises set name = 'Extensión de Espalda',             updated_at = now() where id = 301;
update exercises set name = 'Remo Unilateral con Mancuerna',    updated_at = now() where id = 1637;
update exercises set name = 'Jalón Unilateral en Polea',        updated_at = now() where id = 1972;
update exercises set name = 'Superman',                         updated_at = now() where id = 636;

-- #258 y #259 estaban marcados como barbell y un jalón es de polea. No hay
-- categoría de polea en el catálogo (solo body weight / dumbbell / barbell /
-- other), así que se alinea con el resto de la familia de jalones.
update exercises set equipment_category = 'body weight', updated_at = now() where id = 258;

-- #83 llevaba la imagen de un remo para deltoides posterior
-- (Barbell-rear-delt-row.png), que no corresponde al ejercicio. Mejor sin
-- imagen que con una que engaña.
update exercises set image_url = null, updated_at = now() where id = 83;

commit;
