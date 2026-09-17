-- 037: clasificación biomecánica del catálogo.
--
-- Sustituye la adivinanza por palabra clave de lib/workout/exercise-classifier.ts
-- por un dato etiquetado. El vocabulario está en lib/workout/classification.ts;
-- las heurísticas quedan como respaldo para las filas todavía sin etiquetar.
--
-- Etiquetado a mano sobre los 121 smart_enabled, que son los únicos que usa el
-- Smart Coach. Ninguna fila procede de una base de datos de terceros.

begin;

alter table exercises
  add column if not exists mechanics text,
  add column if not exists movement_pattern text,
  add column if not exists force_type text,
  add column if not exists laterality text;

alter table exercises drop constraint if exists exercises_mechanics_chk;
alter table exercises add constraint exercises_mechanics_chk
  check (mechanics is null or mechanics in ('compound','isolation'));

alter table exercises drop constraint if exists exercises_force_type_chk;
alter table exercises add constraint exercises_force_type_chk
  check (force_type is null or force_type in ('push','pull','static'));

alter table exercises drop constraint if exists exercises_laterality_chk;
alter table exercises add constraint exercises_laterality_chk
  check (laterality is null or laterality in ('bilateral','unilateral'));

alter table exercises drop constraint if exists exercises_movement_pattern_chk;
alter table exercises add constraint exercises_movement_pattern_chk
  check (movement_pattern is null or movement_pattern in (
    'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'fly', 
    'shoulder_extension', 'shoulder_abduction', 'shoulder_flexion', 'shoulder_horizontal_abduction', 
    'scapular_elevation', 'elbow_flexion', 'elbow_extension', 'wrist_flexion', 
    'wrist_extension', 'knee_dominant', 'knee_extension', 'knee_flexion', 'hip_hinge', 
    'hip_extension', 'hip_abduction', 'hip_adduction', 'hip_flexion', 'ankle_plantar_flexion', 
    'spinal_flexion', 'anti_extension', 'anti_rotation', 'rotational', 'loaded_carry', 
    'locomotion'));

-- El planner filtra por patrón dentro de un grupo muscular.
create index if not exists idx_exercises_pattern
  on exercises (muscle_group_id, movement_pattern) where is_active;

-- Etiquetas (121 filas).
update exercises e set mechanics = v.m, movement_pattern = v.p, force_type = v.f,
  laterality = v.l, updated_at = now()
from (values
  (12, 'isolation', 'hip_adduction', 'static', 'bilateral'),  -- Aducción de Cadera en Máquina
  (20, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Press Arnold
  (41, 'compound', 'anti_extension', 'static', 'bilateral'),  -- Rollout Abdominal con Barra
  (73, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de Banca
  (75, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de banca con mancuernas
  (81, 'compound', 'horizontal_pull', 'pull', 'bilateral'),  -- Remo con mancuernas
  (83, 'compound', 'horizontal_pull', 'pull', 'bilateral'),  -- Remo Inclinado con Barra (agarre prono)
  (91, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl con Barra
  (92, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl de Bíceps con Mancuerna
  (94, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl de Bíceps con barra Z
  (95, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl de Bíceps en Polea
  (129, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de Pecho en Máquina
  (139, 'isolation', 'shoulder_horizontal_abduction', 'pull', 'bilateral'),  -- Pec-Deck Inverso
  (145, 'compound', 'rotational', 'pull', 'bilateral'),  -- Woodchoppers en Polea
  (146, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Gemelos en Prensa
  (148, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Pantorrillas en Hack
  (152, 'compound', 'vertical_pull', 'pull', 'bilateral'),  -- Dominadas con Agarre Supino
  (167, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Abdominales
  (171, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Abdominales en Banco Inclinado
  (172, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Abdominales en Máquina
  (173, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Crunches con Polea
  (174, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Crunch con Piernas Elevadas
  (184, 'compound', 'hip_hinge', 'pull', 'bilateral'),  -- Peso Muerto Convencional
  (185, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de Banca Declinado con Barra
  (186, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de Banca Declinado con Mancuernas
  (194, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Fondos en Paralelas
  (202, 'isolation', 'elbow_flexion', 'pull', 'unilateral'),  -- Curl Concentrado con Mancuerna
  (205, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Zancadas con Mancuernas
  (206, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Zancadas Caminando con Mancuernas
  (222, 'isolation', 'shoulder_horizontal_abduction', 'pull', 'bilateral'),  -- Jalón la Cara
  (238, 'isolation', 'fly', 'push', 'bilateral'),  -- Aperturas con Mancuernas
  (245, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Press Francés con Mancuernas
  (246, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Press Francés con Barra SZ
  (256, 'isolation', 'shoulder_flexion', 'push', 'bilateral'),  -- Elevaciones frontales
  (265, 'compound', 'hip_extension', 'push', 'bilateral'),  -- Puente de Glúteos
  (272, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl Martillo
  (979, 'compound', 'hip_flexion', 'static', 'bilateral'),  -- Elevaciones de Piernas Colgado
  (294, 'compound', 'hip_extension', 'push', 'bilateral'),  -- Empuje de Cadera con Barra
  (301, 'compound', 'hip_extension', 'static', 'bilateral'),  -- Hyperextensions
  (308, 'isolation', 'fly', 'push', 'bilateral'),  -- Inclinado Mancuernas Aperturas
  (313, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Inclinado Press up
  (323, 'isolation', 'fly', 'push', 'bilateral'),  -- Aperturas en polea
  (341, 'compound', 'knee_dominant', 'push', 'bilateral'),  -- Sentadillas en Multipress
  (346, 'compound', 'vertical_push', 'push', 'unilateral'),  -- Landmine press
  (348, 'isolation', 'shoulder_abduction', 'push', 'bilateral'),  -- Elevación Lateral con mancuernas
  (365, 'isolation', 'knee_flexion', 'pull', 'bilateral'),  -- Curl Femoral Acostado
  (366, 'isolation', 'knee_flexion', 'pull', 'bilateral'),  -- Curl Femoral Sentado
  (371, 'compound', 'knee_dominant', 'push', 'bilateral'),  -- Prensa de Piernas
  (375, 'compound', 'knee_dominant', 'push', 'bilateral'),  -- Sentadilla Hack en Máquina
  (377, 'isolation', 'hip_flexion', 'static', 'bilateral'),  -- Elevación de Piernas Acostado
  (394, 'compound', 'horizontal_pull', 'pull', 'bilateral'),  -- Remo con polea
  (418, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Press militar
  (458, 'compound', 'anti_extension', 'static', 'bilateral'),  -- Plancha de antebrazo
  (465, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl Predicador
  (475, 'compound', 'vertical_pull', 'pull', 'bilateral'),  -- Dominadas
  (507, 'compound', 'hip_hinge', 'pull', 'bilateral'),  -- Peso Muerto Rumano con Barra
  (538, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press de banca inclinado
  (543, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Press de hombro con maquina
  (567, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Press Militar mancuerna
  (570, 'isolation', 'scapular_elevation', 'pull', 'bilateral'),  -- Hombros Encogimientos
  (572, 'isolation', 'scapular_elevation', 'pull', 'bilateral'),  -- Encogimientos, Dumbbells
  (584, 'isolation', 'elbow_flexion', 'pull', 'unilateral'),  -- Curl Predicador Unilateral
  (590, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Talón Sentado
  (615, 'compound', 'knee_dominant', 'push', 'bilateral'),  -- Sentadillas
  (622, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Talón de Pie
  (659, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Extensión de Tríceps polea
  (660, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Extensión de Tríceps en Polea con Barra
  (661, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Tríceps en Máquina
  (722, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Subidas al Cajón con Peso
  (822, 'isolation', 'shoulder_horizontal_abduction', 'pull', 'bilateral'),  -- Aperturas Posteriores en Polea
  (829, 'isolation', 'shoulder_horizontal_abduction', 'pull', 'bilateral'),  -- Elevación Deltoides Posterior
  (851, 'isolation', 'knee_extension', 'push', 'bilateral'),  -- Extensión de Cuádriceps
  (901, 'compound', 'hip_extension', 'push', 'bilateral'),  -- Hip Thrust con Barra
  (912, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl en Polea con Barra Recta
  (919, 'compound', 'horizontal_pull', 'pull', 'bilateral'),  -- T-Bar Remo
  (978, 'compound', 'hip_flexion', 'static', 'bilateral'),  -- Elevaciones de Rodillas Colgado
  (1000, 'compound', 'vertical_push', 'push', 'bilateral'),  -- Fondos
  (1012, 'isolation', 'elbow_flexion', 'pull', 'unilateral'),  -- Curl de Bíceps alterno
  (1096, 'isolation', 'hip_abduction', 'static', 'unilateral'),  -- Abducción de Pie
  (1112, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press-Ups | Declinado
  (1131, 'isolation', 'hip_extension', 'push', 'unilateral'),  -- Extensión de Glúteos en Polea
  (1132, 'isolation', 'hip_extension', 'push', 'unilateral'),  -- Extensión de Glúteo en Máquina
  (1185, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Extensión de tríceps en polea con cuerda
  (1194, 'isolation', 'anti_rotation', 'push', 'bilateral'),  -- Press Pallof
  (1243, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Pantorrilla Bilateral
  (1277, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press inclinado con mancuernas
  (1289, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl con mancuernas sentado
  (1307, 'compound', 'anti_extension', 'static', 'bilateral'),  -- Plancha Frontal
  (1336, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Tríceps Overhead (Mancuernas)
  (1378, 'isolation', 'shoulder_abduction', 'push', 'unilateral'),  -- Polea Lateral Raises (Unilateral Brazos)
  (1384, 'isolation', 'shoulder_extension', 'pull', 'bilateral'),  -- Pullover Máquina
  (1412, 'isolation', 'rotational', 'static', 'unilateral'),  -- Abdominales en bicicleta
  (1448, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Curl inclinado con mancuernas
  (1469, 'isolation', 'fly', 'push', 'bilateral'),  -- Inclinado over Polea Flye
  (1510, 'compound', 'vertical_pull', 'pull', 'bilateral'),  -- Neutral Grip Lat Pulldown
  (1513, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Overhead Polea Tríceps Extensión
  (1531, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Polea Curls
  (1551, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Press-Up
  (1573, 'compound', 'anti_extension', 'static', 'bilateral'),  -- Ab Wheel
  (1593, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Sentadilla Dividida en Smith
  (1620, 'isolation', 'ankle_plantar_flexion', 'push', 'bilateral'),  -- Elevación de Pantorrilla Sentado con Mancuernas
  (1642, 'compound', 'hip_extension', 'push', 'bilateral'),  -- Empuje de Cadera con Mancuernas
  (1648, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Weighted Crunch
  (1652, 'compound', 'hip_hinge', 'pull', 'bilateral'),  -- Peso Muerto Rumano con Mancuernas
  (1672, 'isolation', 'hip_abduction', 'static', 'bilateral'),  -- Sentado Cadera Abduction
  (1683, 'isolation', 'elbow_flexion', 'pull', 'bilateral'),  -- Zottman Curl
  (1700, 'compound', 'hip_hinge', 'pull', 'bilateral'),  -- Barra Rumano Peso muerto (RDL)
  (1706, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Sentadilla Búlgara con Mancuernas
  (1723, 'isolation', 'hip_extension', 'push', 'unilateral'),  -- Patada de Glúteos (Máquina)
  (1725, 'compound', 'horizontal_pull', 'pull', 'bilateral'),  -- Sentado Remo (Máquina)
  (1726, 'isolation', 'shoulder_extension', 'pull', 'bilateral'),  -- Straight-Brazos Pulldown (Polea)
  (1744, 'isolation', 'shoulder_abduction', 'push', 'bilateral'),  -- Elevación Lateral en maquina
  (1748, 'isolation', 'hip_abduction', 'static', 'bilateral'),  -- Abducción en Máquina
  (1772, 'isolation', 'spinal_flexion', 'static', 'bilateral'),  -- Reverse Crunch
  (1801, 'compound', 'knee_dominant', 'push', 'bilateral'),  -- Sentadilla Completa con Barra
  (1806, 'compound', 'vertical_pull', 'pull', 'bilateral'),  -- Lat Jalón Down
  (1900, 'isolation', 'elbow_extension', 'push', 'bilateral'),  -- Empuje de Tríceps con Cuerda
  (1902, 'compound', 'horizontal_push', 'push', 'bilateral'),  -- Weighted Press-ups
  (1903, 'compound', 'knee_dominant', 'push', 'unilateral'),  -- Zancadas Caminando
  (1904, 'isolation', 'fly', 'push', 'bilateral'),  -- Pec Deck
  (1913, 'compound', 'hip_extension', 'push', 'unilateral')  -- Hip Thrust Unilateral
) as v(id, m, p, f, l) where e.id = v.id;

-- Verificación: las 121 filas quedan etiquetadas.
do $$
declare n int;
begin
  select count(*) into n from exercises
   where is_active and smart_enabled and movement_pattern is null;
  if n > 0 then
    raise exception 'quedan % filas smart_enabled sin clasificar', n;
  end if;
end $$;

-- Huérfanos: dos ejercicios desactivados en junio de 2026 que seguían teniendo
-- series registradas (27 en total). Se reactivan y se les asigna grupo muscular,
-- porque activos sin grupo quedarían invisibles en el filtro por músculo.
update exercises set is_active = true, muscle_group_id = 'piernas', updated_at = now() where id = 1414;  -- Sentadillas Hack
update exercises set is_active = true, muscle_group_id = 'gluteos', updated_at = now() where id = 1751;  -- Polea Jalón through

commit;
