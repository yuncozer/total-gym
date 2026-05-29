import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function createSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();

    const isPremium = !sub || (sub.plan === "premium" && sub.status === "active");

    let workoutQuery = supabase
      .from("workouts")
      .select("id, date, started_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed");

    if (!isPremium) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 30);
      dateLimit.setHours(0, 0, 0, 0);
      workoutQuery = workoutQuery.gte("started_at", dateLimit.toISOString());
    }

    const { data: workouts, error: workoutsError } = await workoutQuery
      .order("started_at", { ascending: false });

    if (workoutsError) throw workoutsError;

    const workoutIds = workouts?.map(w => w.id) || [];

    const emptyResponse = {
      totalWorkouts: 0,
      totalVolume: 0,
      totalDistanceKm: 0,
      totalCardioMinutes: 0,
      streak: 0,
      totalHours: 0,
      workoutsThisWeek: 0,
      workoutsLastWeek: 0,
      volumeThisWeek: 0,
      volumeLastWeek: 0,
      hoursThisWeek: 0,
      hoursLastWeek: 0,
      consistency30d: 0,
      topExercise: null,
      bestRecord: null,
      weeklyVolume: [],
      volumeChange: null,
      streakMilestone: null,
      workoutsChangeWeek: null,
      volumeChangeWeek: null,
      hoursChangeWeek: null,
    };

    if (workoutIds.length === 0) {
      return NextResponse.json(emptyResponse);
    }

    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("exercise_id, exercise_name, reps, weight_kg, is_cardio, distance_km, duration_minutes, is_completed, workout_id")
      .eq("is_completed", true)
      .in("workout_id", workoutIds);

    if (setsError) throw setsError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const workoutDates = workouts
      .map(w => {
        if (w.date) return w.date;
        if (w.completed_at) {
          const d = new Date(w.completed_at);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split("T")[0];
        }
        if (w.started_at) {
          const d = new Date(w.started_at);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split("T")[0];
        }
        return null;
      })
      .filter(Boolean) as string[];

    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));
    const todayWorkout = workoutDates.includes(todayStr);

    let streak = 0;
    const checkDate = new Date(today);
    if (todayWorkout) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const totalWorkouts = workouts.length;

    let totalVolume = 0;
    (sets || []).forEach(s => {
      totalVolume += (s.reps || 0) * (s.weight_kg || 0);
    });
    totalVolume = Math.round(totalVolume);

    let totalHours = 0;
    workouts.forEach(w => {
      if (w.started_at && w.completed_at) {
        const start = new Date(w.started_at).getTime();
        const end = new Date(w.completed_at).getTime();
        totalHours += Math.max(0, (end - start) / (1000 * 60 * 60));
      }
    });
    totalHours = Math.round(totalHours * 10) / 10;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const thisWeekWorkoutsArr = workouts.filter(w =>
      w.started_at && new Date(w.started_at) >= thisWeekStart
    );
    const lastWeekWorkoutsArr = workouts.filter(w =>
      w.started_at && new Date(w.started_at) >= lastWeekStart && new Date(w.started_at) <= lastWeekEnd
    );

    const thisWeekWid = new Set(thisWeekWorkoutsArr.map(w => w.id));
    const lastWeekWid = new Set(lastWeekWorkoutsArr.map(w => w.id));

    const workoutsThisWeek = thisWeekWorkoutsArr.length;
    const workoutsLastWeek = lastWeekWorkoutsArr.length;

    let volumeThisWeek = 0;
    let volumeLastWeek = 0;
    (sets || []).forEach(s => {
      const vol = (s.reps || 0) * (s.weight_kg || 0);
      if (thisWeekWid.has(s.workout_id)) volumeThisWeek += vol;
      if (lastWeekWid.has(s.workout_id)) volumeLastWeek += vol;
    });
    volumeThisWeek = Math.round(volumeThisWeek);
    volumeLastWeek = Math.round(volumeLastWeek);

    let hoursThisWeek = 0;
    let hoursLastWeek = 0;
    thisWeekWorkoutsArr.forEach(w => {
      if (w.started_at && w.completed_at) {
        hoursThisWeek += Math.max(0, (new Date(w.completed_at).getTime() - new Date(w.started_at).getTime()) / (1000 * 60 * 60));
      }
    });
    lastWeekWorkoutsArr.forEach(w => {
      if (w.started_at && w.completed_at) {
        hoursLastWeek += Math.max(0, (new Date(w.completed_at).getTime() - new Date(w.started_at).getTime()) / (1000 * 60 * 60));
      }
    });
    hoursThisWeek = Math.round(hoursThisWeek * 10) / 10;
    hoursLastWeek = Math.round(hoursLastWeek * 10) / 10;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const last30Days = new Set(
      workouts
        .filter(w => w.started_at && new Date(w.started_at) >= thirtyDaysAgo)
        .map(w => new Date(w.started_at).toISOString().split("T")[0])
    );
    const consistency30d = Math.min(100, Math.round((last30Days.size / 30) * 100));

    const exerciseCounts: Record<string, { name: string; count: Set<string> }> = {};
    (sets || []).forEach(s => {
      if (!exerciseCounts[s.exercise_id]) {
        exerciseCounts[s.exercise_id] = { name: s.exercise_name, count: new Set() };
      }
      exerciseCounts[s.exercise_id].count.add(s.workout_id);
    });

    let topExercise: { name: string; count: number } | null = null;
    let maxCount = 0;
    for (const data of Object.values(exerciseCounts)) {
      if (data.count.size > maxCount) {
        maxCount = data.count.size;
        topExercise = { name: data.name, count: data.count.size };
      }
    }

    let bestRecord: { exerciseName: string; weight: number; date: string; daysAgo: number } | null = null;
    if (sets && sets.length > 0) {
      const maxSet = sets.reduce((max, s) =>
        (s.weight_kg || 0) > (max?.weight_kg || 0) ? s : max,
        sets[0]
      );
      if (maxSet && maxSet.weight_kg > 0) {
        const prWorkout = workouts.find(w => w.id === maxSet.workout_id);
        const prDate = prWorkout?.date || (prWorkout?.completed_at?.split("T")[0]) || "";
        const daysAgo = prDate
          ? Math.floor((now.getTime() - new Date(prDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        bestRecord = {
          exerciseName: maxSet.exercise_name,
          weight: Math.round(maxSet.weight_kg),
          date: prDate,
          daysAgo,
        };
      }
    }

    const workoutDateMap = new Map(
      workouts.map(w => [w.id, w.date || w.completed_at?.split("T")[0] || w.started_at?.split("T")[0]])
    );

    const weeklyVolumeMap: Record<string, number> = {};
    (sets || []).forEach(s => {
      const date = workoutDateMap.get(s.workout_id);
      if (!date) return;
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      const weekKey = monday.toISOString().split("T")[0];
      weeklyVolumeMap[weekKey] = (weeklyVolumeMap[weekKey] || 0) + (s.reps || 0) * (s.weight_kg || 0);
    });

    const sortedWeeks = Object.entries(weeklyVolumeMap)
      .sort(([a], [b]) => a.localeCompare(b));

    const weeklyVolume = sortedWeeks.slice(-6).map(([week, volume]) => ({
      week,
      volume: Math.round(volume),
    }));

    let volumeChange: number | null = null;
    if (sortedWeeks.length >= 2) {
      const lastWeek = sortedWeeks[sortedWeeks.length - 1][1];
      const prevWeek = sortedWeeks[sortedWeeks.length - 2][1];
      if (prevWeek > 0) {
        const change = Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
        volumeChange = change > 0 ? change : null;
      }
    }

    let streakMilestone: string | null = null;
    if (streak >= 20) streakMilestone = "¡Leyenda!";
    else if (streak >= 15) streakMilestone = "¡Imparable!";
    else if (streak >= 10) streakMilestone = "¡Encendido!";
    else if (streak >= 5) streakMilestone = null;

    const workoutsChangeWeek = workoutsLastWeek > 0
      ? workoutsThisWeek - workoutsLastWeek
      : workoutsThisWeek > 0 ? workoutsThisWeek : null;

    const volumeChangeWeek = volumeLastWeek > 0
      ? Math.round(((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100)
      : null;

    const hoursChangeWeek = hoursLastWeek > 0
      ? Math.round(((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100)
      : null;

    let totalDistanceKm = 0;
    let totalCardioMinutes = 0;
    (sets || []).forEach(s => {
      if (s.is_cardio) {
        totalDistanceKm += (s.distance_km || 0);
        totalCardioMinutes += (s.duration_minutes || 0);
      }
    });
    totalDistanceKm = Math.round(totalDistanceKm * 100) / 100;
    totalCardioMinutes = Math.round(totalCardioMinutes * 100) / 100;

    return NextResponse.json({
      totalWorkouts,
      totalVolume,
      totalDistanceKm,
      totalCardioMinutes,
      streak,
      totalHours,
      workoutsThisWeek,
      workoutsLastWeek,
      volumeThisWeek,
      volumeLastWeek,
      hoursThisWeek,
      hoursLastWeek,
      consistency30d,
      topExercise,
      bestRecord,
      weeklyVolume,
      volumeChange,
      streakMilestone,
      workoutsChangeWeek,
      volumeChangeWeek,
      hoursChangeWeek,
    });
  } catch (error) {
    console.error("Error loading user stats:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
