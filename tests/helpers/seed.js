const BASE = process.env.BASE_URL || 'http://localhost:3003';

export async function resetData() {
  const res = await fetch(`${BASE}/api/__reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset data');
}

export async function seedConversation(data = {}) {
  const res = await fetch(`${BASE}/api/__seed/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to seed conversation');
  return res.json();
}
