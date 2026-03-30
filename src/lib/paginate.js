export function paginate(array, page = 1, limit = 12) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit) || 12));
  const total = array.length;
  const totalPages = Math.max(1, Math.ceil(total / l));
  const currentPage = Math.min(p, totalPages);
  const start = (currentPage - 1) * l;
  const items = array.slice(start, start + l);
  return { items, total, page: currentPage, totalPages, limit: l };
}
