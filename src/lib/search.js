module.exports = function search(emails, query) {
  const q = query.toLowerCase().trim();
  if (!q) return emails;

  const terms = [];
  let folder = null;
  let hasAttachment = false;
  let label = null;
  let from = null;
  let to = null;
  let isStarred = null;
  let isUnread = null;
  let subject = null;

  const parts = q.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  for (const part of parts) {
    if (part.startsWith('in:')) {
      folder = part.slice(3);
    } else if (part === 'has:attachment') {
      hasAttachment = true;
    } else if (part.startsWith('label:')) {
      label = part.slice(6);
    } else if (part.startsWith('from:')) {
      from = part.slice(5).replace(/"/g, '');
    } else if (part.startsWith('to:')) {
      to = part.slice(3).replace(/"/g, '');
    } else if (part === 'is:starred') {
      isStarred = true;
    } else if (part === 'is:unread') {
      isUnread = true;
    } else if (part.startsWith('subject:')) {
      subject = part.slice(8).replace(/"/g, '');
    } else {
      terms.push(part.replace(/"/g, ''));
    }
  }

  return emails.filter(email => {
    if (folder && email.folder !== folder) return false;
    if (hasAttachment && (!email.attachments || email.attachments.length === 0)) return false;
    if (from) {
      const f = email.from || {};
      if (!(f.address || '').toLowerCase().includes(from) && !(f.name || '').toLowerCase().includes(from)) return false;
    }
    if (to) {
      const toMatch = (email.to || []).some(t =>
        t.address.toLowerCase().includes(to) || t.name.toLowerCase().includes(to)
      );
      if (!toMatch) return false;
    }
    if (isStarred !== null && email.starred !== isStarred) return false;
    if (isUnread !== null && email.read === isUnread) return false;
    if (subject && !(email.subject || '').toLowerCase().includes(subject)) return false;
    if (label) {
      const labelMatch = (email.labels || []).some(l => l.toLowerCase() === label || l.toLowerCase().includes(label));
      if (!labelMatch) return false;
    }

    if (terms.length > 0) {
      const text = [
        email.subject || '',
        email.bodyText || email.body || '',
        (email.from || {}).name || '',
        (email.from || {}).address || '',
        ...(email.to || []).map(t => (t.name || '') + ' ' + (t.address || '')),
      ].join(' ').toLowerCase();

      return terms.every(term => text.includes(term));
    }

    return true;
  });
};
