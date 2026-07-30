function normalizeHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com|x\.com|twitter\.com)\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "")
    .trim()
    .slice(0, 60);
}

export function normalizeInstagramHandle(input: string): string {
  return normalizeHandle(input);
}

export function normalizeTikTokHandle(input: string): string {
  return normalizeHandle(input);
}

export function normalizeXHandle(input: string): string {
  return normalizeHandle(input);
}

export function normalizeWhatsappPhone(input: string): string {
  return input.replace(/[^\d]/g, "").slice(0, 20);
}

export function instagramUrl(handle: string | null | undefined): string | null {
  return handle ? `https://instagram.com/${handle}` : null;
}

export function tiktokUrl(handle: string | null | undefined): string | null {
  return handle ? `https://tiktok.com/@${handle}` : null;
}

export function xUrl(handle: string | null | undefined): string | null {
  return handle ? `https://x.com/${handle}` : null;
}

export function whatsappUrl(phone: string | null | undefined): string | null {
  return phone ? `https://wa.me/${phone}` : null;
}
