"use client";

import type { ReactNode, HTMLAttributes } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ExerciseInWorkout } from "@/lib/workout/types";

export interface DragHandleProps {
  listeners?: HTMLAttributes<HTMLElement>;
  attributes?: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children: (props: DragHandleProps & { setNodeRef: (node: HTMLElement | null) => void }) => ReactNode;
}

function SortableItem({ id, disabled, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging, setNodeRef })}
    </div>
  );
}

interface DraggableExerciseListProps {
  exercises: ExerciseInWorkout[];
  onReorder: (exercises: ExerciseInWorkout[]) => void;
  children: (
    exercise: ExerciseInWorkout,
    index: number,
    dragHandleProps: DragHandleProps
  ) => ReactNode;
}

export function DraggableExerciseList({
  exercises,
  onReorder,
  children,
}: DraggableExerciseListProps) {
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exercises.findIndex(e => e.exerciseId === active.id);
    const newIndex = exercises.findIndex(e => e.exerciseId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...exercises];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map(e => e.exerciseId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <SortableItem key={exercise.exerciseId} id={exercise.exerciseId}>
              {(dragProps) => (
                <>{children(exercise, index, dragProps)}</>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export { GripVertical };
