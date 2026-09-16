-- 036: higiene del catálogo de ejercicios (paso 1 de la auditoría).
-- Ver docs/exercise-catalog-audit.md. NO cambia de fuente de datos: solo
-- fusiona duplicados, unifica las filas partidas en izquierda/derecha y
-- asigna grupo muscular donde el nombre lo dice sin ambigüedad.
--
-- Las filas absorbidas se DESACTIVAN (is_active=false), no se borran: la
-- operación es reversible y cualquier referencia rezagada sigue resolviendo.

begin;

-- Mapa superviviente <- absorbidas. Se usa para repuntar referencias.
create temp table _merge(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _merge(old_id, new_id) values
  (379, 129),
  (1655, 129),
  (1883, 129),
  (1488, 161),
  (591, 167),
  (1933, 167),
  (283, 979),
  (1313, 377),
  (487, 829),
  (1645, 572),
  (1019, 580),
  (1021, 702),
  (1661, 805),
  (1731, 917),
  (987, 986),
  (989, 988),
  (992, 991),
  (1009, 1008),
  (1014, 1013),
  (1029, 1028),
  (1230, 1231),
  (1232, 1233),
  (1621, 1636),
  (1793, 1778),
  (1943, 1939);

-- 1. Repuntar el historial. workout_sets.exercise_id es text.
update workout_sets ws set exercise_id = m.new_id::text
from _merge m where ws.exercise_id = m.old_id::text;

-- 2. Repuntar las plantillas (jsonb, exerciseId es string).
update workout_templates t set exercises = (
  select jsonb_agg(
    case when (e->>'exerciseId') in (select old_id::text from _merge)
      then jsonb_set(e, '{exerciseId}',
             to_jsonb((select new_id::text from _merge where old_id::text = e->>'exerciseId')))
      else e end
    order by ord)
  from jsonb_array_elements(t.exercises) with ordinality x(e, ord))
where exists (
  select 1 from jsonb_array_elements(t.exercises) e
  where (e->>'exerciseId') in (select old_id::text from _merge));

-- 3. El superviviente hereda la mejor imagen y smart_enabled del grupo.
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/129/dbad8cd0-5eeb-4de2-8d9e-80c7770735fd.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'pecho') where id = 129;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/161/b9b1803e-2817-40bf-8ac7-e398ca86d8b4.png'), muscle_group_id = coalesce(muscle_group_id, 'pecho') where id = 161;
update exercises set image_url = coalesce(image_url, 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/167/Crunches-1.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'abdomen') where id = 167;
update exercises set image_url = coalesce(image_url, 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/979/27097a3a-5749-428d-b94c-6082afe390f6.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'abdomen') where id = 979;
update exercises set image_url = coalesce(image_url, 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/377/Leg-raises-2.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'abdomen') where id = 377;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/829/ad724e5c-b1ed-49e8-9279-a17545b0dd0b.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'hombros') where id = 829;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/151/Dumbbell-shrugs-2.png'), smart_enabled = true, muscle_group_id = coalesce(muscle_group_id, 'hombros') where id = 572;
update exercises set muscle_group_id = coalesce(muscle_group_id, 'abdomen') where id = 580;
update exercises set muscle_group_id = coalesce(muscle_group_id, 'pantorrillas') where id = 702;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/805/7a437824-e2cc-46e1-804a-674f0ea31d25.png'), muscle_group_id = coalesce(muscle_group_id, 'triceps') where id = 805;
update exercises set muscle_group_id = coalesce(muscle_group_id, 'hombros') where id = 917;
update exercises set muscle_group_id = coalesce(muscle_group_id, 'piernas') where id = 986;
update exercises set image_url = coalesce(image_url, 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/988/6283b258-a4d7-4833-84f7-a38987022d3d.png'), muscle_group_id = coalesce(muscle_group_id, 'piernas') where id = 988;
update exercises set muscle_group_id = coalesce(muscle_group_id, 'piernas') where id = 991;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/1231/b10457ce-5fa5-4d20-a32f-3c7100c6a9d9.webp'), muscle_group_id = coalesce(muscle_group_id, 'triceps') where id = 1231;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/1233/d7d6f9e1-7834-4cca-bd3b-f9def33ff44d.png'), muscle_group_id = coalesce(muscle_group_id, 'biceps') where id = 1233;
update exercises set image_url = coalesce(image_url, 'https://wger.de/media/exercise-images/1636/1bf3ee54-207c-4b53-b057-15adc1dd6128.png'), muscle_group_id = coalesce(muscle_group_id, 'espalda') where id = 1636;

-- 4. Nombres neutros donde un solo ejercicio estaba partido en izquierda/derecha.
update exercises set name = 'Press de Pecho en Máquina' where id = 129;
update exercises set name = 'Pullover con Mancuerna' where id = 161;
update exercises set name = 'Abdominales' where id = 167;
update exercises set name = 'Elevaciones de Piernas Colgado' where id = 979;
update exercises set name = 'Elevación de Piernas Acostado' where id = 377;
update exercises set name = 'Elevación Deltoides Posterior' where id = 829;
update exercises set name = 'Encogimientos con Mancuernas' where id = 572;
update exercises set name = 'Plancha Lateral' where id = 580;
update exercises set name = 'Elevación de Pantorrilla a una Pierna' where id = 702;
update exercises set name = 'Empuje de tríceps en Polea' where id = 805;
update exercises set name = 'Elevación frontal con Polea' where id = 917;
update exercises set name = 'Sentadilla Lateral' where id = 986;
update exercises set name = 'Sentadilla Búlgara' where id = 988;
update exercises set name = 'Media Sentadilla' where id = 991;
update exercises set name = 'Estiramiento Lateral de Cuello' where id = 1008;
update exercises set name = 'Estiramiento del Elevador de la Escápula' where id = 1013;
update exercises set name = 'Rotación Torácica en Cuadrupedia' where id = 1028;
update exercises set name = 'Estiramiento de Tríceps' where id = 1231;
update exercises set name = 'Estiramiento de Bíceps de Pie' where id = 1233;
update exercises set name = 'Remo Unilateral en Polea' where id = 1636;
update exercises set name = 'Supino inclinado' where id = 1778;
update exercises set name = 'Cuello CARs' where id = 1939;

-- 5. Desactivar las filas absorbidas.
update exercises set is_active = false, updated_at = now()
where id in (select old_id from _merge);

-- 6. Desactivar lo que no es un ejercicio.
update exercises set is_active = false, updated_at = now()
where id in (1114, 1591, 1363);  -- Rest, Respiración profunda, Blackroll

-- 7. Grupo muscular donde el nombre lo dice sin ambigüedad (35 filas).
--    NO se usa la columna category: en las filas sin curar es poco fiable
--    (p. ej. "Burpees" viene como Chest, unos curls femorales como Shoulders).
update exercises set muscle_group_id = 'cardio', updated_at = now() where id in (57, 132, 996, 997);
--   57: Caminata del Oso
--   132: Burpees
--   996: Montañeros
--   997: Burpees de 4 Tiempos
update exercises set muscle_group_id = 'hombros', updated_at = now() where id in (82, 687, 1004, 1005, 1440, 1575, 1707, 1716);
--   82: Elevaciones Posteriores
--   687: Overhead Press
--   1004: Rotación de Hombros Hacia Adelante
--   1005: Rotación de Hombros Hacia Atrás
--   1440: Press OHP
--   1575: De pie Dowel Hombros press
--   1707: Elevacion Lateral polea
--   1716: Inclinado Hombros Press Up
update exercises set muscle_group_id = 'pecho', updated_at = now() where id in (112, 188, 454, 985, 998, 1228, 1467, 1778, 1918);
--   112: Plancha Flexión
--   188: Flexiones Declinadas
--   454: Flexiones de pica
--   985: Flexiones rotación
--   998: Burpees sin Flexión
--   1228: Mancuernas Cerrado grip Banco press
--   1467: Inclinado Cerrado Grip Barra Banco Press
--   1778: Supino inclinado
--   1918: Legend Pecho Press
update exercises set muscle_group_id = 'antebrazos', updated_at = now() where id in (182, 279, 820, 821, 1430);
--   182: Suspensiones en Regleta
--   279: Fortalecedor de Agarre
--   820: Suspensión en regleta de 20 mm
--   821: Dominadas en Tabla de Multipresas
--   1430: Sostén con pellizco de disco
update exercises set muscle_group_id = 'espalda', updated_at = now() where id in (1198, 1219, 1702, 1971, 1972);
--   1198: Inverted Rows
--   1219: Australian Jalón-ups
--   1702: Jalón al pecho con agarre ancho
--   1971: Mentzer Pulldown
--   1972: Unilateral-Brazos Lat Pulldown
update exercises set muscle_group_id = 'piernas', updated_at = now() where id in (1294, 1833);
--   1294: Arco femorale una gamba
--   1833: Suelo Glider Isquiotibiales Curls
update exercises set muscle_group_id = 'gluteos', updated_at = now() where id in (1686, 1703);
--   1686: Glúteos Puente Unilateral-Brazos Press
--   1703: Patadas traseras

-- PENDIENTE DE DECISIÓN (no se toca aquí):
--  · 22 filas de movilidad/estiramiento/cuello sin grupo de fuerza posible.
--    No existe un grupo "movilidad" en lib/data/ejercicios.ts; asignarles uno de
--    los 11 actuales ensuciaría el filtro. Opciones: crear el grupo, o desactivarlas.
--  · 26 filas que requieren criterio humano (nombres rotos o ambiguos).
--    Listado completo en docs/exercise-catalog-audit.md.

-- 8. Restos de la partición izquierda/derecha que el detector no agrupó porque
--    su pareja no existe (#1020) o estaba escrita de otra forma (#1203, una
--    tercera variante de la que ya absorbió #702). Ninguno tenía series.
update exercises set name = 'Pistol Squat', updated_at = now() where id = 1020;
update workout_sets set exercise_id = '702' where exercise_id = '1203';
update exercises set is_active = false, updated_at = now() where id = 1203;

commit;
