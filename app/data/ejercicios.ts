export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: "principiante" | "intermedio" | "avanzado";
  equipment: string;
  muscles: string[];
  secondary: string[];
  muscleNames: string[];
  secondaryNames: string[];
  technique: string[];
  tips: string[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  exercises: Exercise[];
}

export const exercisesDatabase: Record<string, Exercise[]> = {
  pecho: [
    {
      id: "press-banca",
      name: "Press de banca",
      description: "El ejercicio fundamental para pecho. Acostado en un banco, empujas una barra desde el pecho hacia arriba. Desarrolla masa pectoral, tríceps y hombro anterior.",
      difficulty: "principiante",
      equipment: "Barra y banco",
      muscles: ["pectoral-major"],
      secondary: ["triceps", "deltoid-anterior"],
      muscleNames: ["Pectoral mayor"],
      secondaryNames: ["Tríceps", "Deltoide anterior"],
      technique: [
        "Espalda ligeramente arqueada, glúteos en el banco",
        "Agarre ligeramente más ancho que los hombros",
        "Baja la barra controladamente al pecho",
        "Empuja sin cerrar los codos completamente"
      ],
      tips: [
        "Mantén los pies firmly planted en el suelo",
        "No rebotes la barra en el pecho",
        "Usa collarines para seguridad"
      ]
    },
    {
      id: "fondos",
      name: "Fondos",
      description: "Ejercicio compuesto para pectorales inferiores y tríceps. Entre dos barras paralelas, bajas tu cuerpo y lo empujas hacia arriba.",
      difficulty: "intermedio",
      equipment: "Barras paralelas",
      muscles: ["pectoral-lower", "triceps"],
      secondary: ["deltoid-anterior"],
      muscleNames: ["Pectoral inferior", "Tríceps"],
      secondaryNames: ["Deltoide anterior"],
      technique: [
        "Cuerpo erguido, ligeramente inclinado adelante",
        "Desciende hasta que los codos pasen las manos",
        "Empuja explosivamente hacia arriba",
        "Mantén los codos pegados al cuerpo"
      ],
      tips: [
        "No bajar completamente si eres principiante",
        "Inclina el cuerpo para enfatizar pectorales",
        "Usa asistencia si es necesario"
      ]
    },
    {
      id: "aperturas",
      name: "Aperturas",
      description: "Ejercicio de aislamiento para pectorales. Con mancuernas, abres los brazos hacia los lados en posición acostada y cierras arriba.",
      difficulty: "principiante",
      equipment: "Mancuernas",
      muscles: ["pectoral-major"],
      secondary: ["deltoid-anterior"],
      muscleNames: ["Pectoral mayor"],
      secondaryNames: ["Deltoide anterior"],
      technique: [
        "Acostado en banco plano, mancuernas arriba",
        "Abre los brazos en arco amplio",
        "Siente el estirón en los pectorales",
        "Sube las mancuernas sin tocarlas arriba"
      ],
      tips: [
        "No usar peso muy pesado",
        "Mantener ligera flexión de codos",
        "Controla el movimiento siempre"
      ]
    },
    {
      id: "press-inclinado",
      name: "Press inclinado",
      description: "Variación del press de banca con el banco inclinado. Enfatiza la porción clavicular del pectoral (parte superior).",
      difficulty: "intermedio",
      equipment: "Barra y banco inclinado",
      muscles: ["pectoral-clavicular"],
      secondary: ["deltoid-anterior", "triceps"],
      muscleNames: ["Pectoral superior"],
      secondaryNames: ["Deltoide anterior", "Tríceps"],
      technique: [
        "Banco inclinado a 30-45 grados",
        "Baja la barra a la parte superior del pecho",
        "Mantén los codos a 45 grados",
        "Controla el descenso"
      ],
      tips: [
        "No inclinar más de 45 grados",
        "Usar spotter para pesos pesados",
        "Prevenir lesiones de hombro"
      ]
    },
    {
      id: "pullover",
      name: "Pullover",
      description: "Ejercicio clásico para pectorales y dorsal ancho. Con mancuerna, lanzas el peso hacia atrás sobre la cabeza.",
      difficulty: "principiante",
      equipment: "Mancuerna",
      muscles: ["pectoral-major"],
      secondary: ["triceps"],
      muscleNames: ["Pectoral mayor"],
      secondaryNames: ["Tríceps"],
      technique: [
        "Acostado con hombros en el banco",
        "Mancuerna con ambas manos sobre el pecho",
        "Lleva el peso hacia atrás de la cabeza",
        "Regresa controladamente"
      ],
      tips: [
        "Usar peso moderado",
        "Mantener codos ligeramente flexiondos",
        "No arquear excesivamente la espalda"
      ]
    }
  ],
  espalda: [
    {
      id: "dominadas",
      name: "Dominadas",
      description: "El ejercicio rey para espalda. Te cuelgas de una barra y jalas tu cuerpo hacia arriba hasta la barbilla pase la barra.",
      difficulty: "avanzado",
      equipment: "Barra de dominadas",
      muscles: ["dorsal"],
      secondary: ["biceps", "deltoid-posterior"],
      muscleNames: ["Dorsal ancho"],
      secondaryNames: ["Bíceps", "Deltoide posterior"],
      technique: [
        "Agarre略 más ancho que los hombros",
        "拉起身体 until chin passes the bar",
        "Baja controleadamente",
        "No hacer kipping"
      ],
      tips: [
        "Start with assistance if needed",
        "Focus on lats, not arms",
        "Keep shoulders engaged"
      ]
    },
    {
      id: "remo",
      name: "Remo con barra",
      description: "Ejercicio básico para espalda media. Con barra, jala hacia el abdomen en posición inclinada.",
      difficulty: "intermedio",
      equipment: "Barra",
      muscles: ["dorsal-medio"],
      secondary: ["biceps", "deltoid-posterior"],
      muscleNames: ["Dorsal medio"],
      secondaryNames: ["Bíceps", "Deltoide posterior"],
      technique: [
        "Inclinación de 45 grados",
        "Espalda plana, core activado",
        "Jala la barra al abdomen bajo",
        "Regresa con control"
      ],
      tips: [
        "No usar impulso",
        "Mantener espalda recta",
        "No elevar los codos demasiado"
      ]
    },
    {
      id: "jalon-pecho",
      name: "Jalón al pecho",
      description: "Versión guiada de dominadas. En máquina, jalas una barra ancha hacia tu pecho.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["dorsal"],
      secondary: ["biceps"],
      muscleNames: ["Dorsal ancho"],
      secondaryNames: ["Bíceps"],
      technique: [
        "Sentado con muslos firme",
        "Agarre ancho, manos separadas",
        "Jala la barra al pecho superior",
        "Aprieta los dorsales arriba"
      ],
      tips: [
        "Lean back slightly",
        "Focus on squeezing lats",
        "Control the return"
      ]
    },
    {
      id: "remo-mancuerna",
      name: "Remo con mancuerna",
      description: "Ejercicio unilateral para espalda. Un brazo apoiado, jala mancuerna hacia el costado.",
      difficulty: "principiante",
      equipment: "Mancuerna",
      muscles: ["dorsal-medio"],
      secondary: ["biceps"],
      muscleNames: ["Dorsal medio"],
      secondaryNames: ["Bíceps"],
      technique: [
        "Una mano y rodilla en el banco",
        "另一条腿稳定在地面",
        "Jala la mancuerna al torso",
        "Mantén la espalda plana"
      ],
      tips: [
        "No rotar el torso",
        "Controlar el descenso",
        "Sentir la contracción"
      ]
    },
    {
      id: "pulldown",
      name: "Pulldown",
      description: "En máquina de cables, bajas la barra hacia los omóplatos. Versión moderna del jalón.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["dorsal"],
      secondary: ["biceps"],
      muscleNames: ["Dorsal ancho"],
      secondaryNames: ["Bíceps"],
      technique: [
        "Sentado con thighs secured",
        "Agarre略 ancho que los hombros",
        "Lleva la barra a los omóplatos",
        "Siente la compresión en lats"
      ],
      tips: [
        "No tirar de la nuca",
        "Mantener chest up",
        "Controlar el movimiento"
      ]
    },
    {
      id: "remo-maquina",
      name: "Remo con máquina",
      description: "Ejercicio en máquina que aísla los músculos de la espalda. Movimiento controlado con resistencia ajustable.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["dorsal", "dorsal-medio"],
      secondary: ["biceps", "deltoid-posterior"],
      muscleNames: ["Dorsal ancho", "Dorsal medio"],
      secondaryNames: ["Bíceps", "Deltoide posterior"],
      technique: [
        "Ajusta el asiento y el apoyo de pecho para que los agarres queden a la mitad del torso",
        "Apoya bien los pies, pecho contra el apoyo, columna neutra, core activo",
        "Agarra los agarres con las muñecas rectas y los hombros abajo",
        "Empieza llevando las escápulas hacia atrás (retracción) antes de doblar los codos",
        "Tira de los codos hacia los costados hasta que los agarres lleguen a las costillas; aprieta la espalda",
        "Baja el peso despacio, con control y hombros encajados"
      ],
      tips: [
        "Mantén el pecho en el apoyo; no te encojas ni arquees la zona lumbar",
        "Exhala al tirar, inhala al volver",
        "Aísla eficazmente los músculos de la espalda",
        "Menos riesgo de lesiones debido al movimiento controlado"
      ]
    },
    {
      id: "remo-t",
      name: "Remo T",
      description: "Ejercicio compuesto para espalda superior y media usando una barra T. Excelente para desarrollar anchura y grosor.",
      difficulty: "intermedio",
      equipment: "Barra T / Máquina",
      muscles: ["dorsal", "dorsal-medio"],
      secondary: ["biceps", "deltoid-posterior", "trapecio"],
      muscleNames: ["Dorsal ancho", "Dorsal medio"],
      secondaryNames: ["Bíceps", "Deltoide posterior", "Trapecio"],
      technique: [
        "Colócate a horcajadas sobre la barra con los pies al ancho de los hombros",
        "Flexiona ligeramente las rodillas e inclínate aproximadamente 45 grados",
        "Agarra el mango con ambas manos, con las palmas enfrentadas o mirando hacia ti",
        "Mantén la espalda recta, core activado y columna neutral",
        "Tira de la barra hacia tu pecho inferior o abdomen superior",
        "Mantén los codos cerca de tu cuerpo y concéntrate en apretar las escápulas arriba",
        "Baja lentamente la barra a la posición inicial con control"
      ],
      tips: [
        "No arquear la espalda - mantén columna neutral",
        "Evita balancear el torso o dar tirones al peso",
        "Usa un mango ancho para enfatizar parte superior de la espalda",
        "Para mayor énfasis en bíceps, usa agarre supino"
      ]
    }
  ],
  hombros: [
    {
      id: "press-militar",
      name: "Press militar",
      description: "Ejercicio fundamental para hombros. De pie, presionas una barra o mancuernas sobre la cabeza.",
      difficulty: "intermedio",
      equipment: "Barra/Mancuernas",
      muscles: ["deltoid-anterior"],
      secondary: ["deltoid-lateral"],
      muscleNames: ["Deltoide anterior"],
      secondaryNames: ["Deltoide lateral"],
      technique: [
        "De pie, piesseparados ancho",
        "Barra a la altura de los hombros",
        "Presiona hacia arriba",
        "No bloquear los codos"
      ],
      tips: [
        "Keep core tight",
        "No arquear la espalda",
        "Use tempo controlado"
      ]
    },
    {
      id: "elev-lateral",
      name: "Elevaciones laterales",
      description: "Ejercicio para deltoide lateral. Con mancuernas, levantas los brazos hacia los lados.",
      difficulty: "principiante",
      equipment: "Mancuernas",
      muscles: ["deltoid-lateral"],
      secondary: ["deltoid-anterior"],
      muscleNames: ["Deltoide lateral"],
      secondaryNames: ["Deltoide anterior"],
      technique: [
        "Brazos a los lados, codos ligeramente flexionados",
        "Eleva los brazos hasta la altura de los hombros",
        "No elevar above shoulder level",
        "Reduce con control"
      ],
      tips: [
        "No usar momentum",
        "Mantener slight bend in elbows",
        "Imaginar vertiendo agua de botellas"
      ]
    },
    {
      id: "crucifix",
      name: "Crucifix",
      description: "Para deltoide posterior. Con mancuernas, extiendes los brazos a los lados a la altura de los hombros.",
      difficulty: "principiante",
      equipment: "Mancuernas",
      muscles: ["deltoid-posterior"],
      secondary: [],
      muscleNames: ["Deltoide posterior"],
      secondaryNames: [],
      technique: [
        "Inclinarse ligeramente forward",
        "Brazos colgando",
        "Elevar como wings de avión",
        "Squeeze shoulder blades together"
      ],
      tips: [
        "Mantener back straight",
        "No usar pesos muy pesados",
        "Focus on rear delt"
      ]
    },
    {
      id: "face-pull",
      name: "Face pull",
      description: "Para manguito rotador y rear delt. Con banda o polea, jalas hacia tu cara.",
      difficulty: "principiante",
      equipment: "Polea",
      muscles: ["deltoid-posterior"],
      secondary: ["supraespinoso"],
      muscleNames: ["Deltoide posterior"],
      secondaryNames: ["Supraespinoso"],
      technique: [
        "Posición de polea alta",
        "Jala hacia la cara",
        "Separar hands al llegar a los lados",
        "Mantener codos arriba del nivel de hombros"
      ],
      tips: [
        "Keep elbows high",
        "Squeeze at the end",
        "Essential for shoulder health"
      ]
    },
    {
      id: "arnold",
      name: "Press Arnold",
      description: "Press con rotación de muneca. Introducido por Arnold Schwarzenegger.",
      difficulty: "intermedio",
      equipment: "Mancuernas",
      muscles: ["deltoid-anterior"],
      secondary: ["deltoid-lateral"],
      muscleNames: ["Deltoide anterior"],
      secondaryNames: ["Deltoide lateral"],
      technique: [
        "Sentado con mancuernas a la altura del pecho",
        "Press while rotating palms forward",
        "Lower with reverse rotation",
        "Mantener back straight"
      ],
      tips: [
        "Control the rotation",
        "Don't use excessive weight",
        "Great for anterior development"
      ]
    },
    {
      id: "aperturas-posteriores-maquina",
      name: "Aperturas posteriores en máquina",
      description: "Ejercicio de aislamiento en máquina para deltoides posteriores. Sentado con el pecho contra el cojín, empujas las manijas hacia atrás en un arco controlado.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["deltoid-posterior"],
      secondary: ["trapecio-medio", "romboides"],
      muscleNames: ["Deltoide posterior"],
      secondaryNames: ["Trapecio medio", "Romboides"],
      technique: [
        "Ajusta los brazos de la máquina a la posición adecuada",
        "Regula la altura del asiento para que tus manos estén al nivel de tus hombros",
        "Siéntate de cara a la máquina con el pecho firmemente apoyado contra el cojín",
        "Agarra las manijas con un agarre neutral o prono",
        "Mantén los brazos ligeramente flexionados en los codos",
        "Exhala mientras tires de las manijas hacia afuera y hacia atrás en un arco controlado",
        "Enfócate en juntar los omóplatos en el punto máximo del movimiento",
        "Inhala mientras regresas lentamente las manijas a la posición inicial con control"
      ],
      tips: [
        "Mantén el pecho firmly against the cojín para prevenir movimientos compensatorios",
        "Evita balancear el torso o usar impulso",
        "No bloquear los codos - mantén slight flexión durante todo el movimiento",
        "Perfecto para equilibrar el desarrollo de los hombros"
      ]
    }
  ],
  biceps: [
    {
      id: "curl-bicep",
      name: "Curl biceps",
      description: "Ejercicio clásico para bíceps. Con mancuernas o barra, subes el peso enrollando los brazos.",
      difficulty: "principiante",
      equipment: "Mancuernas/Barra",
      muscles: ["biceps"],
      secondary: ["braquial"],
      muscleNames: ["Bíceps braquial"],
      secondaryNames: ["Braquial"],
      technique: [
        "Brazos abajo, palmas hacia adelante",
        "Enrollar el peso hacia los hombros",
        "No balancear el cuerpo",
        "Bajar completamente"
      ],
      tips: [
        "Keep elbows at sides",
        "Don't swing for momentum",
        "Squeeze at the top"
      ]
    },
    {
      id: "curl-martillo",
      name: "Curl martillo",
      description: "Con mancuernas, palmas enfrentadas. Trabaja braquial y bíceps lateral.",
      difficulty: "principiante",
      equipment: "Mancuernas",
      muscles: ["biceps"],
      secondary: ["braquial", "pronador"],
      muscleNames: ["Bíceps", "Braquial"],
      secondaryNames: ["Pronador"],
      technique: [
        "Palmas enfrentadas (posición de martillo)",
        "Elevar las mancuernas a los hombros",
        "Mantener codos quietos",
        "No rotar las muñecas"
      ],
      tips: [
        "Excelente para forearm development",
        "Mantener control",
        "Alternate arms or do together"
      ]
    },
    {
      id: "curl-concentr",
      name: "Curl concentrado",
      description: "Sentado, apoyas el codo y subes la mancuerna. Para bíceps aislado.",
      difficulty: "principiante",
      equipment: "Mancuerna",
      muscles: ["biceps"],
      secondary: [],
      muscleNames: ["Bíceps"],
      secondaryNames: [],
      technique: [
        "Sentado, codo apoiado en el muslo",
        "Coger mancuerna con misma mano",
        "Elevar exclusivamente con bíceps",
        "Bajar con control"
      ],
      tips: [
        "Maximum peak contraction",
        "Don't let elbow drift",
        "Strict form essential"
      ]
    }
  ],
  triceps: [
    {
      id: "press-cierre",
      name: "Press cierre",
      description: "Con mancuernas arriba, las acercas. Trabaja tríceps y pecho inner.",
      difficulty: "intermedio",
      equipment: "Mancuernas",
      muscles: ["triceps"],
      secondary: ["pectoral-inner"],
      muscleNames: ["Tríceps"],
      secondaryNames: ["Pectoral interno"],
      technique: [
        "Acostado, mancuernas arriba de los hombros",
        "Bajar las mancuernas una hacia la otra",
        "Mantener codos controlados",
        "Regresar a posición inicial"
      ],
      tips: [
        "Keep elbows in close to body",
        "Don't clank the dumbbells",
        "Great for triceps and inner chest"
      ]
    },
    {
      id: "ext-tricep",
      name: "Extensiones",
      description: "Con mancuerna arriba, bajas el peso flexionando los codos. Ejercicio clásico de tríceps.",
      difficulty: "principiante",
      equipment: "Mancuerna",
      muscles: ["triceps"],
      secondary: [],
      muscleNames: ["Tríceps"],
      secondaryNames: [],
      technique: [
        "Mancuerna con ambas manos arriba del pecho",
        "Bajar el peso hacia la frente",
        "Mantener codos apuntaando al techo",
        "Extiende de vuelta"
      ],
      tips: [
        "Keep elbows close to head",
        "Don't flare elbows out",
        "Control throughout"
      ]
    }
  ],
  antebrazo: [
    {
      id: "curl-muneca",
      name: "Curl de muñecas",
      description: "Ejercicio para antebrazos. Sentado con los antebrazos en los muslos, enrollas la muñeca hacia arriba.",
      difficulty: "principiante",
      equipment: "Barra/Mancuerna",
      muscles: ["antebrazo-flexores"],
      secondary: [],
      muscleNames: ["Flexores de antebrazo"],
      secondaryNames: [],
      technique: [
        "Sentado, antebrazos sobre los muslos con muñecas libre al borde",
        "Agarra la barra o mancuerna con palma hacia arriba",
        "Enrolla la muñeca hacia arriba contra la resistencia",
        "Baja con control lentamente"
      ],
      tips: [
        "Usa peso ligero - los antebrazos se fatigan rápido",
        "Mantén la muñeca estable",
        "No balancear los brazos"
      ]
    },
    {
      id: "ext-muneca",
      name: "Extensión de muñecas",
      description: "Ejercicio para extensores de antebrazo. Inverso al curl de muñecas, trabajas la parte superior del antebrazo.",
      difficulty: "principiante",
      equipment: "Barra/Mancuerna",
      muscles: ["antebrazo-extensores"],
      secondary: [],
      muscleNames: ["Extensores de antebrazo"],
      secondaryNames: [],
      technique: [
        "Sentado, antebrazos sobre los muslos con muñecas libre al borde",
        "Agarra la barra o mancuerna con palma hacia abajo",
        "Extiende la muñeca hacia arriba contra la resistencia",
        "Baja con control lentamente"
      ],
      tips: [
        "Peso ligero es suficiente",
        "Importante para equilibrar con los flexores",
        "Ayuda a prevenir túnel carpiano"
      ]
    }
  ],
  piernas: [
    {
      id: "sentadilla",
      name: "Sentadilla",
      description: "El ejercicio rey de piernas. Bajas las rodillas como sentándote en una silla invisible.",
      difficulty: "principiante",
      equipment: "Barra/Sin peso",
      muscles: ["quadriceps"],
      secondary: ["gluteus", "hamstrings"],
      muscleNames: ["Cuádriceps"],
     secondaryNames: ["Glúteos", "Isquiotibiales"],
      technique: [
        "Pies ancho, puntas levemente hacia afuera",
        "Bajar hasta muslos paralelos al suelo",
        "Rodillas siguen dirección de los pies",
        "Mantener co20 back straight"
      ],
      tips: [
        "Keep weight on mid-foot",
        "Don't let knees cave inward",
        "Hit depth for optimal results"
      ]
    },
    {
      id: "peso-muerto",
      name: "Peso muerto",
      description: "Desde el suelo, levantas la barra manteniendo espalda recta. Trabaja isquiotibiales y glúteos.",
      difficulty: "intermedio",
      equipment: "Barra",
      muscles: ["hamstrings"],
      secondary: ["gluteus", "erector"],
      muscleNames: ["Isquiotibiales"],
      secondaryNames: ["Glúteos", "Erectores"],
      technique: [
        "Barra sobre los pies, agarrequite bajo",
        "Mantener espalda plana como una mesa",
        "Levantar con piernas y glúteos, no espalda",
        "Barra close to legs throughout"
      ],
      tips: [
        "Keep bar close to shins",
        "Don't round lower back",
        "Drive through heels"
      ]
    },
    {
      id: "prensa",
      name: "Prensa de piernas",
      description: "En máquina, empujas el peso con las piernas. Versión guiada de sentadilla.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["quadriceps"],
      secondary: ["gluteus"],
      muscleNames: ["Cuádriceps"],
      secondaryNames: ["Glúteos"],
      technique: [
        "Piesancho en la plataforma",
        "Bajar el peso con control",
        "Rodillas siguen dirección de los pies",
        "No bloquear completamente"
      ],
      tips: [
        "Vary foot placement targets",
        "Don't lock knees",
        "Control descent"
      ]
    },
    {
      id: "ext-cuadri",
      name: "Extensión de cuádriceps",
      description: "En máquina, extiendes las piernas. Aísla cuádriceps.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["quadriceps"],
      secondary: [],
      muscleNames: ["Cuádriceps"],
      secondaryNames: [],
      technique: [
        "Sentado con rodilleras detr30s de las piernas",
        "Extiende las piernas completamente",
        "Squeeze at the top",
        "Bajar con control"
      ],
      tips: [
        "Don't use momentum",
        "Squeeze at top for peak",
        "Light weight works well"
      ]
    },
    {
      id: "curl-femoral",
      name: "Curl femoral",
      description: "En máquina, doblas las rodillas. Trabaja isquiotibiales.",
      difficulty: "principiante",
      equipment: "Máquina",
      muscles: ["hamstrings"],
      secondary: ["gluteus"],
      muscleNames: ["Isquiotibiales"],
      secondaryNames: ["Glúteos"],
      technique: [
        "Acostado boca abajo, rodilleras detr30s de los talones",
        "Doblar las rodillas hacia los glúteos",
        "Squeeze at the top",
        "Regresar con control"
      ],
      tips: [
        "Don't round lower back",
        "Squeeze at top",
        "Control the negative"
      ]
    }
  ],
  gluteos: [
    {
      id: "hip-thrust",
      name: "Hip thrust",
      description: "El mejor ejercicio para glúteos. Con espalda en banco, empujas las caderas hacia arriba con peso.",
      difficulty: "intermedio",
      equipment: "Barra/Banco",
      muscles: ["gluteus-maximus"],
      secondary: ["hamstrings"],
      muscleNames: ["Glúteo mayor"],
      secondaryNames: ["Isquiotibiales"],
      technique: [
        "Escap20s sobre el banco, barra sobre las caderas",
        "Piesplan25 en el suelo, knees bent",
        "Empuja las caderas hacia el techo",
        "Squeeze at top, then lower"
      ],
      tips: [
        "Usepad for bar comfort",
        "Drive through heels",
        "Squeeze glutes hard at top"
      ]
    },
    {
      id: "patada-gluteo",
      name: "Patada de glúteo",
      description: "En cuatro puntos, patadas hacia atrás con pierna. Aísla glúteos.",
      difficulty: "principiante",
      equipment: "Sin equipo/Máquina",
      muscles: ["gluteus-maximus"],
      secondary: ["hamstrings"],
      muscleNames: ["Glúteo mayor"],
      secondaryNames: ["Isquiotibiales"],
      technique: [
        "Manos y rodillas en el suelo",
        "Una pierna hacia arriba y atrás",
        "Mantener cadera estable",
        "Squeeze at top of each rep"
      ],
      tips: [
        "Keep core tight",
        "Don't rotate hips",
        "Use ankle weight for progress"
      ]
    },
    {
      id: "puente",
      name: "Puente de cadera",
      description: "Acostado, levantas las caderas. Versión sin peso del hip thrust.",
      difficulty: "principiante",
      equipment: "Sin equipo",
      muscles: ["gluteus-maximus"],
      secondary: ["hamstrings"],
      muscleNames: ["Glúteo mayor"],
      secondaryNames: ["Isquiotibiales"],
      technique: [
        "Acostadoboca arriba, rodillas flexionadas",
        "Piesplantados en el suelo",
        "Levantar las caderas hacia el techo",
        "Squeeze and lower with control"
      ],
      tips: [
        "Push through heels",
        "Squeeze at top",
        "Add weight when strong Enough"
      ]
    },
    {
      id: "zancadas",
      name: "Zancadas",
      description: "Pasos largos alternando piernas. Funciona glúteos y cuádriceps.",
      difficulty: "principiante",
      equipment: "Mancuernas",
      muscles: ["gluteus-maximus"],
      secondary: ["quadriceps"],
      muscleNames: ["Glúteo mayor"],
      secondaryNames: ["Cuádriceps"],
      technique: [
        "De pie, mancuernas a los lados",
        "Paso largo hacia adelante",
        "Bajar hasta ambos knees a 90 grados",
        "Regresar al origen"
      ],
      tips: [
        "Keep torso upright",
        "Step far enough",
        "Control the movement"
      ]
    },
    {
      id: "squat-glute",
      name: "Sentadilla sumo",
      description: "Sentadilla con pies separados y puntas hacia afuera. Enfatiza glúteos internos.",
      difficulty: "principiante",
      equipment: "Barra",
      muscles: ["gluteus-medius"],
      secondary: ["quadriceps"],
      muscleNames: ["Glúteo medio"],
      secondaryNames: ["Cuádriceps"],
      technique: [
        "Pies muy separados, puntas 45 grados afuera",
        "Bajar entre las piernas",
        "Mantener pecho arriba",
        "Push through heels"
      ],
      tips: [
        "Great for glute med",
        "Keep knees out",
        "Stay upright"
      ]
    }
  ],
  abdomen: [
    {
      id: "crunch",
      name: "Crunch",
      description: "Ejercicio básico de abdominales. Acostado, elevas el torso hacia las rodillas.",
      difficulty: "principiante",
      equipment: "Sin equipo",
      muscles: ["rectus-abdominis"],
      secondary: ["obliques"],
      muscleNames: ["Recto abdominal"],
      secondaryNames: ["Oblicuos"],
      technique: [
        "Acostado con rodillas flexionadas",
        "Manos detr30s de la cabeza",
        "Elevar hombros del suelo",
        "No jalar el cuello"
      ],
      tips: [
        "Don't pull head",
        "Focus on abs, not hip flexors",
        "Control every rep"
      ]
    },
    {
      id: "plank",
      name: "Plank",
      description: "En posición de plancha, mantienes el cuerpo recto. Resiste y fortalece.",
      difficulty: "principiante",
      equipment: "Sin equipo",
      muscles: ["core"],
      secondary: [],
      muscleNames: ["Core completo"],
      secondaryNames: [],
      technique: [
        "Codos bajo los hombros",
        "Cuerpo formando línea recta",
        "Abdomen contraído",
        "No dejar caer caderas"
      ],
      tips: [
        "Don't let hips sag",
        "Squeeze glutes",
        "Breathe normally"
      ]
    },
    {
      id: "elev-piernas",
      name: "Elevación de piernas",
      description: "Acostado, elevas las piernas rectas. Trabaja abdominales inferiores.",
      difficulty: "intermedio",
      equipment: "Sin equipo",
      muscles: ["rectus-abdominis-lower"],
      secondary: [],
      muscleNames: ["Recto abdominal inferior"],
      secondaryNames: [],
      technique: [
        "Acostadoboca arriba, piernas rectas",
        "Elevar piernas a 90 grados",
        "Mantener espalda baja en el suelo",
        "Bajarcon control"
      ],
      tips: [
        "Don't use momentum",
        "Hands under glutes for support",
        "Keep lower back pressed"
      ]
    },
    {
      id: "rueda",
      name: "Rueda abdominal",
      description: "Con una rueda, avanzas y regresas. Entrenamiento avanzado de core.",
      difficulty: "avanzado",
      equipment: "Rueda abdominal",
      muscles: ["core"],
      secondary: [],
      muscleNames: ["Core completo"],
      secondaryNames: [],
      technique: [
        "Rodillas en el suelo, inmue en las manos",
        "Rodar hacia adelante extendiendo arms",
        "Mantener core tight",
        "Regresar al origen"
      ],
      tips: [
        "Start with short range",
        "Don't go too far",
        "Progress gradually"
      ]
    },
    {
      id: "russian-twist",
      name: "Torsión rusa",
      description: "Sentado, rotas el torso a cada lado. Trabaja oblicuos.",
      difficulty: "principiante",
      equipment: "Mancuerna/Opcional",
      muscles: ["obliques"],
      secondary: ["rectus-abdominis"],
      muscleNames: ["Oblicuos"],
      secondaryNames: ["Recto abdominal"],
      technique: [
        "Sentado, piernas ligeramente flexionadas",
        "Torso hacia atrás, manteniendo espalda recta",
        "Rotar el torso a cada lado",
        "Mantener core engaged"
      ],
      tips: [
        "Feet can be elevated",
        "Use medicine ball for progress",
        "Focus on rotation"
      ]
    }
  ],
  cardio: [
    {
      id: "cinta",
      name: "Cinta/Pasillo",
      description: "Cardiovascular básico. Caminar o trotar en cinta rodante.",
      difficulty: "principiante",
      equipment: "Cinta",
      muscles: ["full-body"],
      secondary: ["calves"],
      muscleNames: ["Cuerpo completo"],
      secondaryNames: ["Gemelos"],
      technique: [
        "Mantener postura erguida",
        "Abs activos",
        "Piernas en marcha natural",
        "No agarrarse de las barras"
      ],
      tips: [
        "Start with walking",
        "Use handrails sparingly",
        "Progress gradually"
      ]
    },
    {
      id: "bicicleta",
      name: "Bicicleta",
      description: "Cardio de bajo impacto. Mejor para rodillas sensibles.",
      difficulty: "principiante",
      equipment: "Bicicleta estática",
      muscles: ["quadriceps"],
      secondary: ["gluteus"],
      muscleNames: ["Cuádriceps"],
      secondaryNames: ["Glúteos"],
      technique: [
        "Sentado con slight lean forward",
        "Pedaleo completo",
        "Resistance ajustable",
        "Keep core engaged"
      ],
      tips: [
        "Good for beginners",
        "Easy on knees",
        "Adjust resistance for challenge"
      ]
    },
    {
      id: "eliptica",
      name: "Elíptica",
      description: "Movimiento combinado. Bajo impacto, alto gasto calórico.",
      difficulty: "principiante",
      equipment: "Elíptica",
      muscles: ["full-body"],
      secondary: ["gluteus"],
      muscleNames: ["Cuerpo completo"],
      secondaryNames: ["Glúteos"],
      technique: [
        "Pies en los pedales",
        "Move arms and legs together",
        "Leaning slightly forward",
        "Use moving handles if available"
      ],
      tips: [
        "Low impact cardio",
        "Use arm levers for full body",
        "Keep heart rate up"
      ]
    },
    {
      id: "escaladora",
      name: "Escaladora",
      description: "Subes escalones repetidamente. Intensivo y efectivo.",
      difficulty: "intermedio",
      equipment: "Escaladora",
      muscles: ["gluteus"],
      secondary: ["quadriceps", "calves"],
      muscleNames: ["Glúteos"],
      secondaryNames: ["Cuádriceps", "Gemelos"],
      technique: [
        "Piesalternando rápidamente",
        "Keep torso upright",
        "Use handrails for balance",
        "Find comfortable pace"
      ],
      tips: [
        "Very intense cardio",
        "Start slowly",
        "Watch heart rate"
      ]
    },
    {
      id: "remadora",
      name: "Remadora",
      description: "Ejercicio de cardio y fuerza. Simula remar.",
      difficulty: "intermedio",
      equipment: "Remadora",
      muscles: ["back"],
      secondary: ["quadriceps", "core"],
      muscleNames: ["Espalda"],
      secondaryNames: ["Cuádriceps", "Core"],
      technique: [
        "Sentado con straps en los pies",
        "Leaning forward, then back",
        "Push with legs, pull with arms",
        "Full range of motion"
      ],
      tips: [
        "Full body cardio",
        "Good for back strength too",
        "Keep back straight"
      ]
    }
  ]
};

export const muscleGroupsData: MuscleGroup[] = [
  {
    id: "pecho",
    name: "PECHO",
    description: "Músculos pectorales mayores y menores",
    icon: "⛹️",
    exercises: exercisesDatabase.pecho
  },
  {
    id: "espalda",
    name: "ESPALDA",
    description: "Dorsales, trapecios y lumbares",
    icon: "🏋️",
    exercises: exercisesDatabase.espalda
  },
  {
    id: "hombros",
    name: "HOMBROS",
    description: "Deltoides anterior, lateral y posterior",
    icon: "🎯",
    exercises: exercisesDatabase.hombros
  },
  {
    id: "biceps",
    name: "BÍCEPS",
    description: "Músculos frontales del brazo",
    icon: "💪",
    exercises: exercisesDatabase.biceps
  },
  {
    id: "triceps",
    name: "TRÍCEPS",
    description: "Músculos posteriores del brazo",
    icon: "🦾",
    exercises: exercisesDatabase.triceps
  },
  {
    id: "antebrazo",
    name: "ANTEBRAZO",
    description: "Flexores y extensores del antebrazo",
    icon: "🤜",
    exercises: exercisesDatabase.antebrazo
  },
  {
    id: "piernas",
    name: "PIERNAS",
    description: "Cuádriceps y gemelos",
    icon: "🦵",
    exercises: exercisesDatabase.piernas
  },
  {
    id: "gluteos",
    name: "GLUTEOS",
    description: "Glúteos mayores y médios",
    icon: "🍑",
    exercises: exercisesDatabase.gluteos
  },
  {
    id: "abdomen",
    name: "ABDOMEN",
    description: "Rectos, oblicuos y transverso",
    icon: "🎽",
    exercises: exercisesDatabase.abdomen
  },
  {
    id: "cardio",
    name: "CARDIO",
    description: "Sistema cardiovascular",
    icon: "❤️",
    exercises: exercisesDatabase.cardio
  }
];