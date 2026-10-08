-- 040: nombres de ejercicio en español correcto. APLICADA el 2026-10-08.
--
-- 101 filas activas tenían el nombre en spanglish o con el orden de palabras
-- del inglés. Pero solo 17 las ve un usuario (8 smart_enabled + 10 con
-- historial); las otras 84 no son smart ni se han usado nunca, así que se
-- quedan como están hasta decidir si deben seguir activas.
--
-- Los nombres siguen el estilo de la terminología estándar en español:
-- <movimiento> <modificador> con <equipamiento>.

begin;

-- 1. Dos pares que resultaron ser el mismo ejercicio escrito de dos formas.
--    Sobrevive el que tiene el historial; el otro se desactiva.
create temp table _m(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _m values
  (188, 1112),   -- "Flexiones Declinadas" (0 series) -> "Press-Ups | Declinado" (50)
  (1654, 1744);  -- "Máquina Lateral wise" (6) -> "Elevación Lateral en maquina" (12)

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

-- 2. Renombrados.
--    pecho
update exercises set name = 'Flexiones Declinadas',            updated_at = now() where id = 1112;
update exercises set name = 'Flexiones de Brazos',             updated_at = now() where id = 1551;
update exercises set name = 'Flexiones Inclinadas',            updated_at = now() where id = 313;
update exercises set name = 'Flexiones con Lastre',            updated_at = now() where id = 1902;
update exercises set name = 'Flexiones con Manos Juntas',      updated_at = now() where id = 1086;
update exercises set name = 'Flexiones en Paralelas',          updated_at = now() where id = 1113;
update exercises set name = 'Aperturas en Polea en Banco Inclinado', updated_at = now() where id = 1469;
--    espalda
update exercises set name = 'Jalón al Pecho con Agarre Neutro', updated_at = now() where id = 1510;
update exercises set name = 'Jalón al Pecho',                   updated_at = now() where id = 1806;
update exercises set name = 'Pullover en Polea Alta',           updated_at = now() where id = 1137;
update exercises set name = 'Dominadas con Agarre Ancho',       updated_at = now() where id = 1542;
update exercises set name = 'Jalón a la Cara con Mancuernas',   updated_at = now() where id = 1639;
--    hombros
update exercises set name = 'Elevación Lateral en Polea a una Mano', updated_at = now() where id = 1378;
update exercises set name = 'Elevación Lateral en Máquina',     updated_at = now() where id = 1744;
update exercises set name = 'Jalón a la Cara',                  updated_at = now() where id = 222;
--    biceps
update exercises set name = 'Curl Martillo Cruzado con Mancuernas', updated_at = now() where id = 1502;
--    gluteos
update exercises set name = 'Pull-Through en Polea',            updated_at = now() where id = 1751;

-- 3. #1498 estaba en biceps y es un press de pecho. Nombre y grupo.
update exercises set name = 'Press con Mancuernas Codos Pegados',
                     muscle_group_id = 'pecho', updated_at = now() where id = 1498;

commit;
