import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { claimInviteToken } from "@/lib/trainer/claim";
import { clientIp, rateLimit } from "@/lib/http/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(`register:${clientIp(request)}`, 5, 15 * 60 * 1000);
    if (limited) return limited;

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email) || email.length > 255) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await claimInviteToken(supabase, data.user.id, inviteToken);
    }

    return NextResponse.json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}