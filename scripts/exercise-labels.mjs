// id: [mechanics, pattern, force, laterality]
// Etiquetado a mano sobre nuestros 121 smart_enabled, usando el vocabulario de
// lib/workout/classification.ts. No se copian filas de ninguna base ajena.
export const L = {
  // --- abdomen ---
  41:  ['compound','anti_extension','static','bilateral'],      // Rollout Abdominal con Barra
  145: ['compound','rotational','pull','bilateral'],            // Woodchoppers en Polea
  167: ['isolation','spinal_flexion','static','bilateral'],     // Abdominales
  171: ['isolation','spinal_flexion','static','bilateral'],     // Abdominales en Banco Inclinado
  172: ['isolation','spinal_flexion','static','bilateral'],     // Abdominales en Máquina
  173: ['isolation','spinal_flexion','static','bilateral'],     // Crunches con Polea
  174: ['isolation','spinal_flexion','static','bilateral'],     // Crunch con Piernas Elevadas
  979: ['compound','hip_flexion','static','bilateral'],         // Elevaciones de Piernas Colgado (superviviente tras la 036)
  377: ['isolation','hip_flexion','static','bilateral'],        // Elevación de Piernas Acostado
  458: ['compound','anti_extension','static','bilateral'],      // Plancha de antebrazo
  978: ['compound','hip_flexion','static','bilateral'],         // Elevaciones de Rodillas Colgado
  1194:['isolation','anti_rotation','push','bilateral'],        // Press Pallof
  1307:['compound','anti_extension','static','bilateral'],      // Plancha Frontal
  1412:['isolation','rotational','static','unilateral'],        // Abdominales en bicicleta
  1573:['compound','anti_extension','static','bilateral'],      // Ab Wheel
  1648:['isolation','spinal_flexion','static','bilateral'],     // Weighted Crunch
  1772:['isolation','spinal_flexion','static','bilateral'],     // Reverse Crunch

  // --- biceps --- (todos flexión de codo, monoarticular, tracción)
  91:  ['isolation','elbow_flexion','pull','bilateral'],        // Curl con Barra
  92:  ['isolation','elbow_flexion','pull','bilateral'],        // Curl de Bíceps con Mancuerna
  94:  ['isolation','elbow_flexion','pull','bilateral'],        // Curl con barra Z
  95:  ['isolation','elbow_flexion','pull','bilateral'],        // Curl en Polea
  202: ['isolation','elbow_flexion','pull','unilateral'],       // Curl Concentrado
  272: ['isolation','elbow_flexion','pull','bilateral'],        // Curl Martillo
  465: ['isolation','elbow_flexion','pull','bilateral'],        // Curl Predicador
  584: ['isolation','elbow_flexion','pull','unilateral'],       // Curl Predicador Unilateral
  912: ['isolation','elbow_flexion','pull','bilateral'],        // Curl en Polea Barra Recta
  1012:['isolation','elbow_flexion','pull','unilateral'],       // Curl alterno
  1289:['isolation','elbow_flexion','pull','bilateral'],        // Curl sentado
  1448:['isolation','elbow_flexion','pull','bilateral'],        // Curl inclinado
  1531:['isolation','elbow_flexion','pull','bilateral'],        // Polea Curls
  1683:['isolation','elbow_flexion','pull','bilateral'],        // Zottman Curl

  // --- espalda ---
  81:  ['compound','horizontal_pull','pull','bilateral'],       // Remo con mancuernas
  83:  ['compound','horizontal_pull','pull','bilateral'],       // Remo Inclinado con Barra
  152: ['compound','vertical_pull','pull','bilateral'],         // Dominadas Agarre Supino
  184: ['compound','hip_hinge','pull','bilateral'],             // Peso Muerto Convencional
  301: ['compound','hip_extension','static','bilateral'],       // Hyperextensions
  394: ['compound','horizontal_pull','pull','bilateral'],       // Remo con polea
  475: ['compound','vertical_pull','pull','bilateral'],         // Dominadas
  919: ['compound','horizontal_pull','pull','bilateral'],       // T-Bar Remo
  1384:['isolation','shoulder_extension','pull','bilateral'],   // Pullover Máquina
  1510:['compound','vertical_pull','pull','bilateral'],         // Neutral Grip Lat Pulldown
  1700:['compound','hip_hinge','pull','bilateral'],             // RDL con Barra
  1725:['compound','horizontal_pull','pull','bilateral'],       // Remo Sentado Máquina
  1726:['isolation','shoulder_extension','pull','bilateral'],   // Straight-Arm Pulldown
  1806:['compound','vertical_pull','pull','bilateral'],         // Lat Pulldown

  // --- gluteos ---
  265: ['compound','hip_extension','push','bilateral'],         // Puente de Glúteos
  294: ['compound','hip_extension','push','bilateral'],         // Empuje de Cadera con Barra
  901: ['compound','hip_extension','push','bilateral'],         // Hip Thrust con Barra
  1096:['isolation','hip_abduction','static','unilateral'],     // Abducción de Pie
  1131:['isolation','hip_extension','push','unilateral'],       // Extensión de Glúteos en Polea
  1132:['isolation','hip_extension','push','unilateral'],       // Extensión de Glúteo Máquina
  1642:['compound','hip_extension','push','bilateral'],         // Empuje de Cadera Mancuernas
  1723:['isolation','hip_extension','push','unilateral'],       // Patada de Glúteos Máquina
  1748:['isolation','hip_abduction','static','bilateral'],      // Abducción en Máquina
  1913:['compound','hip_extension','push','unilateral'],        // Hip Thrust Unilateral

  // --- hombros ---
  20:  ['compound','vertical_push','push','bilateral'],         // Press Arnold
  139: ['isolation','shoulder_horizontal_abduction','pull','bilateral'], // Pec-Deck Inverso
  222: ['isolation','shoulder_horizontal_abduction','pull','bilateral'], // Jalón a la Cara
  256: ['isolation','shoulder_flexion','push','bilateral'],     // Elevaciones frontales
  346: ['compound','vertical_push','push','unilateral'],        // Landmine press
  348: ['isolation','shoulder_abduction','push','bilateral'],   // Elevación Lateral mancuernas
  418: ['compound','vertical_push','push','bilateral'],         // Press militar
  543: ['compound','vertical_push','push','bilateral'],         // Press hombro máquina
  567: ['compound','vertical_push','push','bilateral'],         // Press Militar mancuerna
  570: ['isolation','scapular_elevation','pull','bilateral'],   // Encogimientos
  572: ['isolation','scapular_elevation','pull','bilateral'],   // Encogimientos Mancuernas
  822: ['isolation','shoulder_horizontal_abduction','pull','bilateral'], // Aperturas Posteriores Polea
  829: ['isolation','shoulder_horizontal_abduction','pull','bilateral'], // Elevación Deltoides Posterior
  1378:['isolation','shoulder_abduction','push','unilateral'],  // Elevación Lateral Polea Unilateral
  1744:['isolation','shoulder_abduction','push','bilateral'],   // Elevación Lateral máquina

  // --- pantorrillas ---
  146: ['isolation','ankle_plantar_flexion','push','bilateral'],
  148: ['isolation','ankle_plantar_flexion','push','bilateral'],
  590: ['isolation','ankle_plantar_flexion','push','bilateral'],
  622: ['isolation','ankle_plantar_flexion','push','bilateral'],
  1243:['isolation','ankle_plantar_flexion','push','bilateral'],
  1620:['isolation','ankle_plantar_flexion','push','bilateral'],

  // --- pecho ---
  73:  ['compound','horizontal_push','push','bilateral'],       // Press de Banca
  75:  ['compound','horizontal_push','push','bilateral'],       // Press banca mancuernas
  129: ['compound','horizontal_push','push','bilateral'],       // Press de Pecho Máquina
  185: ['compound','horizontal_push','push','bilateral'],       // Banca Declinado Barra
  186: ['compound','horizontal_push','push','bilateral'],       // Banca Declinado Mancuernas
  194: ['compound','vertical_push','push','bilateral'],         // Fondos en Paralelas
  238: ['isolation','fly','push','bilateral'],                  // Aperturas con Mancuernas
  308: ['isolation','fly','push','bilateral'],                  // Aperturas Inclinado
  313: ['compound','horizontal_push','push','bilateral'],       // Inclinado Press up
  323: ['isolation','fly','push','bilateral'],                  // Aperturas en polea
  538: ['compound','horizontal_push','push','bilateral'],       // Press banca inclinado
  1112:['compound','horizontal_push','push','bilateral'],       // Press-Ups Declinado
  1277:['compound','horizontal_push','push','bilateral'],       // Press inclinado mancuernas
  1469:['isolation','fly','push','bilateral'],                  // Polea Flye Inclinado
  1551:['compound','horizontal_push','push','bilateral'],       // Press-Up (flexión)
  1902:['compound','horizontal_push','push','bilateral'],       // Weighted Press-ups
  1904:['isolation','fly','push','bilateral'],                  // Pec Deck

  // --- piernas ---
  12:  ['isolation','hip_adduction','static','bilateral'],      // Aducción de Cadera Máquina
  205: ['compound','knee_dominant','push','unilateral'],        // Zancadas con Mancuernas
  206: ['compound','knee_dominant','push','unilateral'],        // Zancadas Caminando Mancuernas
  341: ['compound','knee_dominant','push','bilateral'],         // Sentadillas Multipress
  365: ['isolation','knee_flexion','pull','bilateral'],         // Curl Femoral Acostado
  366: ['isolation','knee_flexion','pull','bilateral'],         // Curl Femoral Sentado
  371: ['compound','knee_dominant','push','bilateral'],         // Prensa de Piernas
  375: ['compound','knee_dominant','push','bilateral'],         // Sentadilla Hack Máquina
  507: ['compound','hip_hinge','pull','bilateral'],             // RDL con Barra
  615: ['compound','knee_dominant','push','bilateral'],         // Sentadillas
  722: ['compound','knee_dominant','push','unilateral'],        // Subidas al Cajón
  851: ['isolation','knee_extension','push','bilateral'],       // Extensión de Cuádriceps
  1593:['compound','knee_dominant','push','unilateral'],        // Sentadilla Dividida Smith
  1652:['compound','hip_hinge','pull','bilateral'],             // RDL Mancuernas
  1672:['isolation','hip_abduction','static','bilateral'],      // Abducción Sentado
  1706:['compound','knee_dominant','push','unilateral'],        // Sentadilla Búlgara
  1801:['compound','knee_dominant','push','bilateral'],         // Sentadilla Completa Barra
  1903:['compound','knee_dominant','push','unilateral'],        // Zancadas Caminando

  // --- triceps ---
  245: ['isolation','elbow_extension','push','bilateral'],      // Press Francés Mancuernas
  246: ['isolation','elbow_extension','push','bilateral'],      // Press Francés Barra SZ
  659: ['isolation','elbow_extension','push','bilateral'],      // Extensión Tríceps polea
  660: ['isolation','elbow_extension','push','bilateral'],      // Extensión Tríceps Polea Barra
  661: ['isolation','elbow_extension','push','bilateral'],      // Tríceps en Máquina
  1000:['compound','vertical_push','push','bilateral'],         // Fondos
  1185:['isolation','elbow_extension','push','bilateral'],      // Extensión Tríceps cuerda
  1336:['isolation','elbow_extension','push','bilateral'],      // Tríceps Overhead Mancuernas
  1513:['isolation','elbow_extension','push','bilateral'],      // Overhead Polea Tríceps
  1900:['isolation','elbow_extension','push','bilateral'],      // Empuje de Tríceps Cuerda
}
