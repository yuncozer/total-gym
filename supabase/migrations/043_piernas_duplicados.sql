-- 043: depuración del grupo "piernas". APLICADA el 2026-10-08. 112 -> 108.
--
-- Mucho menos que en espalda, y es un buen resultado: de 112 filas solo 4 son
-- duplicados reales. El resto de lo que el agrupador marcó son variantes
-- legítimas, porque en tren inferior el modificador ES el ejercicio: una
-- sentadilla búlgara, una pistol y una hack no son "sentadilla" repetida.

begin;

create temp table _m(old_id bigint primary key, new_id bigint not null) on commit drop;
insert into _m(old_id, new_id) values
  (364, 366),    -- "Curl Femoral" genérico -> "Curl Femoral Sentado" (56 series)
  (375, 1414),   -- "Sentadilla Hack en Máquina" -> "Sentadillas Hack" (21 series)
  (124, 203),    -- "Sentadilla con Disco al Frente" -> "Sentadilla con Disco"
  (1361, 1612);  -- "Sentadilla Frontal Bilateral con Pesa Rusa" -> "con pesa rusa"

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

-- #1414 tenía el uso (21 series) pero ni imagen ni smart_enabled; #375 tenía
-- las dos cosas y el nombre correcto.
update exercises set
  image_url = 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/375/Narrow-stance-hack-squats-1-1024x721.png',
  smart_enabled = true,
  name = 'Sentadilla Hack en Máquina',
  updated_at = now()
 where id = 1414;

commit;
