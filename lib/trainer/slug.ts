function slugBase(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugify(name: string): string {
  const base = slugBase(name);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "entrenador"}-${suffix}`;
}

export function slugifyCustom(text: string): string {
  return slugBase(text) || "entrenador";
}

const MIN_SLUG_LENGTH = 3;

const RESERVED_SLUGS = new Set([
  // rutas top-level reales de la app
  "admin", "api", "auth", "login", "register", "reporte", "perfil",
  "entrenador", "checkin", "amigos", "entrenamiento", "estadisticas",
  "historial", "progreso", "workout", "shared", "shared-friend", "e",
  // términos de negocio / genéricos
  "www", "soporte", "support", "help", "ayuda", "contacto", "contact",
  "home", "index", "app", "static", "assets", "public", "terminos",
  "privacidad", "terms", "privacy", "legal", "null", "undefined",
  "test", "demo", "entrenadores", "trainer", "trainers", "cliente",
  "clientes", "totalgym", "total-gym",
]);

const OFFENSIVE_WORDS = new Set([
  "puta", "puto", "putas", "putos", "mierda", "cabron", "cabrona",
  "pendejo", "pendeja", "idiota", "imbecil", "estupido", "estupida",
  "maricon", "zorra", "perra", "verga", "joder", "gilipollas",
  "fuck", "shit", "bitch", "asshole", "cunt", "whore", "slut", "nigger",
  "faggot", "retard", "porn", "sex", "xxx",
]);

export type SlugValidationError = "too_short" | "reserved" | "offensive";

export function validateSlugFormat(slug: string): SlugValidationError | null {
  if (slug.length < MIN_SLUG_LENGTH) return "too_short";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  if (slug.split("-").some((segment) => OFFENSIVE_WORDS.has(segment))) return "offensive";
  return null;
}

export const SLUG_ERROR_MESSAGES: Record<SlugValidationError, string> = {
  too_short: "Ese link es muy corto, usa al menos 3 caracteres",
  reserved: "Ese link no está permitido",
  offensive: "Ese link no está permitido",
};
