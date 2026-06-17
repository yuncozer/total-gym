-- =====================================================
-- smart_enabled: columna para ejercicios curados por IA
-- =====================================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS smart_enabled boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_exercises_smart_enabled
  ON exercises (muscle_group_id)
  WHERE smart_enabled = true AND is_active = true;

-- =====================================================
-- Seed: ejercicios aprobados por IA por grupo muscular
-- =====================================================

-- Pecho (17)
UPDATE exercises SET smart_enabled = true WHERE id IN (73,75,538,1277,129,185,186,194,238,308,323,1469,1904,1551,313,1112,1902);

-- Espalda (14)
UPDATE exercises SET smart_enabled = true WHERE id IN (475,152,1806,1510,81,83,394,919,1725,184,1700,301,1384,1726);

-- Hombros (15)
UPDATE exercises SET smart_enabled = true WHERE id IN (20,418,567,543,346,348,1744,1378,256,139,822,829,222,570,572);

-- Bíceps (14)
UPDATE exercises SET smart_enabled = true WHERE id IN (91,94,92,1012,272,465,584,95,912,1448,202,1289,1683,1531);

-- Tríceps (10)
UPDATE exercises SET smart_enabled = true WHERE id IN (1000,246,245,1185,660,659,1336,1513,661,1900);

-- Piernas (19)
UPDATE exercises SET smart_enabled = true WHERE id IN (615,1801,375,341,371,851,365,366,507,1652,184,205,206,1706,1593,722,1672,12,1903);

-- Glúteos (10)
UPDATE exercises SET smart_enabled = true WHERE id IN (901,294,265,1642,1913,1131,1132,1723,1748,1096);

-- Pantorrillas (6)
UPDATE exercises SET smart_enabled = true WHERE id IN (622,590,146,148,1243,1620);

-- Abdomen (17)
UPDATE exercises SET smart_enabled = true WHERE id IN (41,173,167,172,171,174,283,377,978,458,1307,1573,1194,145,1412,1772,1648);
