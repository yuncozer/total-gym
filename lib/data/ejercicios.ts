export interface MuscleGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  wgerCategoryId: number;
  wgerMuscleIds: number[];
  wgerSecondaryMuscleIds: number[];
}

export const muscleGroupsData: MuscleGroup[] = [
  {
    id: "pecho",
    name: "PECHO",
    description: "Músculos pectorales mayores y menores",
    icon: "⛹️",
    image: "/images/exercises/pecho.jpeg",
    wgerCategoryId: 11,
    wgerMuscleIds: [4],
    wgerSecondaryMuscleIds: [2, 5, 3]
  },
  {
    id: "espalda",
    name: "ESPALDA",
    description: "Dorsales, trapecios y lumbares",
    icon: "🏋️",
    image: "/images/exercises/espalda.png",
    wgerCategoryId: 12,
    wgerMuscleIds: [12, 9],
    wgerSecondaryMuscleIds: [1, 13, 5, 2]
  },
  {
    id: "hombros",
    name: "HOMBROS",
    description: "Deltoides anterior, lateral y posterior",
    icon: "🎯",
    image: "/images/exercises/hombros.png",
    wgerCategoryId: 13,
    wgerMuscleIds: [2],
    wgerSecondaryMuscleIds: [9, 5]
  },
  {
    id: "biceps",
    name: "BÍCEPS",
    description: "Músculos frontales del brazo",
    icon: "💪",
    image: "/images/exercises/biceps.png",
    wgerCategoryId: 8,
    wgerMuscleIds: [1],
    wgerSecondaryMuscleIds: [13]
  },
  {
    id: "triceps",
    name: "TRÍCEPS",
    description: "Músculos posteriores del brazo",
    icon: "🦾",
    image: "/images/exercises/triceps.png",
    wgerCategoryId: 8,
    wgerMuscleIds: [5],
    wgerSecondaryMuscleIds: [2, 4]
  },
  {
    id: "piernas",
    name: "PIERNAS",
    description: "Cuádriceps, isquiotibiales y gemelos",
    icon: "🦵",
    image: "/images/exercises/piernas.png",
    wgerCategoryId: 9,
    wgerMuscleIds: [10, 11],
    wgerSecondaryMuscleIds: [8, 7, 15]
  },
  {
    id: "gluteos",
    name: "GLÚTEOS",
    description: "Glúteos mayores y médios",
    icon: "🍑",
    image: "/images/exercises/gluteos.png",
    wgerCategoryId: 9,
    wgerMuscleIds: [8],
    wgerSecondaryMuscleIds: [11, 10]
  },
  {
    id: "abdomen",
    name: "ABDOMEN",
    description: "Rectos, oblicuos y transverso",
    icon: "🎽",
    image: "/images/exercises/abdomen.png",
    wgerCategoryId: 10,
    wgerMuscleIds: [6, 14],
    wgerSecondaryMuscleIds: [9]
  },
  {
    id: "pantorrillas",
    name: "PANTORRILLAS",
    description: "Gemelos y sóleo",
    icon: "🦶",
    image: "/images/exercises/pantorrillas.png",
    wgerCategoryId: 14,
    wgerMuscleIds: [7, 15],
    wgerSecondaryMuscleIds: []
  },
  {
    id: "cardio",
    name: "CARDIO",
    description: "Sistema cardiovascular",
    icon: "❤️",
    image: "/images/exercises/cardio.png",
    wgerCategoryId: 15,
    wgerMuscleIds: [],
    wgerSecondaryMuscleIds: []
  }
];