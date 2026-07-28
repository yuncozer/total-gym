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
