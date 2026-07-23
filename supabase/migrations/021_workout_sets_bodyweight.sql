ALTER TABLE workout_sets ADD COLUMN is_bodyweight boolean DEFAULT false;
CREATE INDEX idx_workout_sets_bodyweight ON workout_sets(is_bodyweight) WHERE is_bodyweight = true;
