import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = "workout-photos";

function createAuthClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const authClient = createAuthClient(request);
    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: photos, error } = await admin
      .from("workout_photos")
      .select("id, storage_path, created_at")
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const urls = (photos || []).map(p => {
      const { data } = admin.storage.from(BUCKET).getPublicUrl(p.storage_path);
      return { id: p.id, url: data.publicUrl, createdAt: p.created_at };
    });

    return NextResponse.json({ photos: urls });
  } catch (error) {
    console.error("Error loading workout photos:", error);
    return NextResponse.json({ error: "Failed to load photos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const authClient = createAuthClient(request);
    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check photo limit
    const { count } = await admin
      .from("workout_photos")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", workoutId);

    if ((count || 0) >= MAX_PHOTOS) {
      return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${workoutId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: inserted, error: dbError } = await admin
      .from("workout_photos")
      .insert({
        workout_id: workoutId,
        storage_path: storagePath,
      })
      .select("id")
      .single();

    if (dbError) throw dbError;

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({ id: inserted.id, url: urlData.publicUrl });
  } catch (error) {
    console.error("Error uploading workout photo:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const authClient = createAuthClient(request);
    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId } = await request.json();
    if (!photoId) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: photo } = await admin
      .from("workout_photos")
      .select("storage_path")
      .eq("id", photoId)
      .eq("workout_id", workoutId)
      .maybeSingle();

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await admin.storage.from(BUCKET).remove([photo.storage_path]);
    await admin.from("workout_photos").delete().eq("id", photoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workout photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
