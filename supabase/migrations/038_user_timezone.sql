-- 038: zona horaria por usuario.
--
-- `workouts.date` se escribía con la fecha UTC del servidor (Vercel corre en
-- UTC), así que un entrenamiento empezado a las 19:00 en UTC-5 se guardaba con
-- la fecha del día siguiente. 84 de 374 filas (22,5 %) estaban desplazadas.
--
-- Una fecha de calendario solo significa algo respecto a una zona horaria, así
-- que la guardamos por usuario. El cliente la manda al crear un entrenamiento.

begin;

alter table profiles add column if not exists timezone text;

comment on column profiles.timezone is
  'Zona IANA del usuario (ej. America/Bogota). La fija el cliente; null = sin determinar.';

commit;
