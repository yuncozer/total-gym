-- 042: añade "polea" y "máquina" a la taxonomía. APLICADA el 2026-10-08.
--
-- El equipamiento de wger no tiene ninguna de las dos: sus 11 ids son barra,
-- barra EZ, mancuernas, mat, balón, barra fija, peso corporal, banco, banco
-- inclinado, kettlebell y banda. Así que todo jalón, polea o prensa llegaba
-- como "body weight" y el filtro por equipamiento de la app no podía
-- distinguirlos. El modal de ejercicio personalizado ya ofrecía Polea y
-- Máquina, y el planner ya las esperaba en EQUIPMENT_PRIORITY: las categorías
-- estaban previstas, solo que nunca se cablearon.
--
-- La única señal disponible para las filas existentes es el nombre.

begin;

-- Si el nombre nombra el equipamiento, eso manda: "jalón" en español es
-- cualquier tracción y aparece en ejercicios con mancuerna ("Jalón a la Cara
-- con Mancuernas"), y "Sentadilla Hack con Barra" no es la máquina de hack.
update exercises set equipment_category = 'cable', updated_at = now()
 where is_active
   and name !~* '\y(mancuerna|mancuernas|db)\y'
   and name ~* '\y(polea|poleas|cable|jal[oó]n|jalones|pulldown|crossover|pull-?through|gironda)\y'
   and equipment_category is distinct from 'cable';

update exercises set equipment_category = 'machine', updated_at = now()
 where is_active
   and name !~* '\y(mancuerna|mancuernas|db)\y'
   and name !~* '\y(polea|poleas|cable|jal[oó]n|jalones|pulldown|crossover|pull-?through|gironda)\y'
   and (
     (name ~* '\yhack\y' and name !~* 'con barra')
     or name ~* '\y(m[aá]quina|machine|smith|multipower|multipress|multi press|prensa|pec.?deck|leverage|hammerstrength|legend)\y'
   )
   and equipment_category is distinct from 'machine';

commit;
