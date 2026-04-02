export function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function uniqueOrganizationSlug(
  baseSlug: string,
  attempt: number,
): string {
  if (attempt === 0) return baseSlug;
  return `${baseSlug}-${attempt}`;
}
