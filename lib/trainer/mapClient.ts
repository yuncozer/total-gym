interface TrainerClientRow {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  goal: string | null;
  level: string | null;
  start_date: string | null;
  notes: string | null;
  invite_token: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapTrainerClient(row: TrainerClientRow) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    goal: row.goal,
    level: row.level,
    startDate: row.start_date,
    notes: row.notes,
    inviteToken: row.invite_token,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
