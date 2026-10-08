-- Revisión visual del catálogo: se comparó una a una cada imagen de los 211
-- ejercicios activos con imagen contra el nombre de su ficha.
--
-- Esta migración sólo toca lo que engaña al usuario: imágenes que muestran
-- otro ejercicio, imágenes en negro, logotipos y URLs rotas. Las marcas de
-- agua de terceros y las diferencias de estilo quedan fuera a propósito.
--
-- Parte A: 10 fichas recuperan una imagen correcta. Las 7 "rotas" lo estaban
-- porque wger renumeró sus carpetas; el archivo sigue existiendo con el mismo
-- nombre en otra ruta. Todas las URLs de abajo se comprobaron con HTTP 200 y
-- se revisaron visualmente antes de escribirlas aquí.
--
-- Parte B: 18 fichas se quedan sin imagen. No existe sustituto válido y es
-- preferible no mostrar nada antes que mostrar otro ejercicio.

-- A. Reemplazos verificados -------------------------------------------------

-- 232 series registradas; su imagen devolvía 404 desde hacía tiempo.
update exercises set image_url = 'https://wger.de/media/exercise-images/16/Incline-press-1.png'
  where id = 1277;  -- Press inclinado con mancuernas

update exercises set image_url = 'https://wger.de/media/exercise-images/152/6c1a7459-266d-491a-bd50-7cbaea2bc771.png'
  where id = 154;   -- Dominadas con Agarre Supino (404; apuntaba además a la carpeta 181)

update exercises set image_url = 'https://wger.de/media/exercise-images/487/ad724e5c-b1ed-49e8-9279-a17545b0dd0b.png'
  where id = 829;   -- Elevación Deltoides Posterior (404)

update exercises set image_url = 'https://wger.de/media/exercise-images/282/f6121ac9-330e-4ed7-8219-91ce246bf871.png'
  where id = 907;   -- Flexiones de Pino (404)

update exercises set image_url = 'https://wger.de/media/exercise-images/1290/c05818bf-1c81-46df-9f24-42e354265388.png'
  where id = 1190;  -- Curl de Bíceps con agarre prono (404)

update exercises set image_url = 'https://wger.de/media/exercise-images/512/b938437e-ff00-4679-9036-acb41bb28bbd.png'
  where id = 921;   -- Tirar de cables sentados (404)

update exercises set image_url = 'https://wger.de/media/exercise-images/88/Narrow-grip-bench-press-1.png'
  where id = 1897;  -- Press de Banca con Agarre Cerrado (404)

-- Compartía archivo con #1117; ahora muestra su propia máquina.
update exercises set image_url = 'https://wger.de/media/exercise-images/1725/f0ebd44e-b8e1-400c-b598-ca371f3a07af.png'
  where id = 1119;  -- Remo maquina agarre estrecho

-- Llevaba un logotipo abstracto en lugar de un ejercicio.
update exercises set image_url = 'https://wger.de/media/exercise-images/150/Barbell-shrugs-1.png'
  where id = 570;   -- Hombros Encogimientos

-- Mostraba a alguien de pie con mancuernas, sin zancada. Se reutiliza la
-- imagen de #1903 "Zancadas Caminando", que sí es correcta.
update exercises set image_url = 'https://urkfnctewebefcnqyhyb.supabase.co/storage/v1/object/public/exercise-images/1903/6ec66efd-e74f-4142-bed1-0a0ac74e3294.png'
  where id = 206;   -- Zancadas Caminando con Mancuernas

-- B. Sin sustituto válido: se retira la imagen ------------------------------

update exercises set image_url = null where id in (
  -- Imagen completamente en negro
  194,   -- Fondos en Paralelas (Smart Coach, 53 series)
  349,   -- Lateral Rows en Polea, Uno Armed

  -- Logotipo, no un ejercicio
  1573,  -- Ab Wheel (Smart Coach)

  -- Muestra otro movimiento del que dice el nombre
  184,   -- Peso Muerto Convencional: foto con mancuernas (Smart Coach, 46 series)
  484,   -- Rack Peso muerto: press declinado en Smith
  1109,  -- Bíceps concentrado: una máquina
  1378,  -- Elevación Lateral en Polea: foto con banda elástica (Smart Coach)
  1519,  -- Extensión de Tríceps sobre la Cabeza: press de hombro sentado
  1637,  -- Remo Unilateral con Mancuerna: foto de polea
  1736,  -- Peso muerto una pierna: patada sobre banco
  1387,  -- Patadas Isquiotibiales: patada frontal de pie
  31,    -- Sostenimiento Lateral Isométrico: elevación lateral de hombro
  50,    -- Extensión de Tríceps: foto de un press de banca
  1223,  -- Claps over head: recorte pixelado de una elevación lateral
  1325,  -- Press Off Lateral: fotograma de un vídeo en césped

  -- Mismo archivo que otra ficha, que es la que le corresponde
  427,   -- Encogimientos Negativos: comparte imagen con #171

  -- URL rota sin reemplazo limpio en origen
  1491,  -- Remada unilateral no cabo
  1636   -- Remo Unilateral en Polea
);
