-- 039: corrige las fechas de entrenamiento escritas en UTC. NO APLICAR TODAVÍA.
--
-- Requiere que `profiles.timezone` esté poblada. Se rellena sola en cuanto cada
-- usuario abre la app y crea un entrenamiento (ver migración 038 y
-- lib/time/userTimeZone.ts). Aplicar antes de eso no corregiría nada, porque
-- sin zona conocida no hay forma de saber qué día era para el usuario.
--
-- Comprobar primero cuántos perfiles ya la tienen:
--   select count(*) total, count(timezone) con_zona from profiles;
--
-- Y qué filas cambiarían, antes de escribir nada:
--   select w.id, w.date fecha_actual,
--          (w.started_at at time zone p.timezone)::date fecha_corregida
--     from workouts w join profiles p on p.id = w.user_id
--    where p.timezone is not null and w.started_at is not null
--      and w.date <> (w.started_at at time zone p.timezone)::date;

begin;

update workouts w
   set date = (w.started_at at time zone p.timezone)::date
  from profiles p
 where p.id = w.user_id
   and p.timezone is not null
   and w.started_at is not null
   and w.date <> (w.started_at at time zone p.timezone)::date;

commit;

-- Después, las rachas se recalculan solas: se derivan del historial en cada
-- lectura, no hay contadores guardados que arreglar. Conviene igualmente correr
-- sync_gamification para los usuarios afectados si sus XP/rachas se muestran
-- desde `profiles`.
