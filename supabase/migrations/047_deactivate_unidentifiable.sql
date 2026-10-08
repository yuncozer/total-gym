-- Las tres fichas que quedaron sin imagen en 046 y cuyo nombre tampoco
-- describe un ejercicio reconocible. No son variantes que podamos corregir:
-- no hay nada que nombrar ni que ilustrar.
--
--   #1223 "Claps over head"      — sin grupo muscular, 0 series
--   #1325 "Press Off Lateral"    — 3 series; era un fotograma de vídeo
--   #31   "Sostenimiento Lateral Isométrico" — clasificado en bíceps, 0 series
--
-- Las 3 series ya registradas sobre #1325 se conservan: workout_sets guarda
-- el nombre junto al exercise_id, así que el historial sigue leyéndose.

update exercises
   set is_active = false, smart_enabled = false, updated_at = now()
 where id in (1223, 1325, 31);
