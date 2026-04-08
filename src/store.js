class Store {
  constructor() {
    this.cache = this._defaultData();
  }

  _defaultData() {
    return {
      emails: [],
      labels: [
        { id: 'personal', name: 'Personal', color: '#4285f4' },
        { id: 'work', name: 'Work', color: '#ea4335' },
        { id: 'finance', name: 'Finance', color: '#34a853' },
      ],
      contacts: [],
      attachments: {},
    };
  }

  async init() {}

  getEmails() {
    return this.cache.emails;
  }

  getLabels() {
    return this.cache.labels;
  }

  getContacts() {
    return this.cache.contacts;
  }

  getAttachment(id) {
    return this.cache.attachments[id] || null;
  }

  async addEmail(email) {
    this.cache.emails.unshift(email);
    return email;
  }

  async updateEmail(id, updates) {
    const email = this.cache.emails.find(e => e.id === id);
    if (!email) return null;
    Object.assign(email, updates);
    return email;
  }

  async deleteEmail(id) {
    const idx = this.cache.emails.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.cache.emails.splice(idx, 1);
    return true;
  }

  async addLabel(label) {
    this.cache.labels.push(label);
    return label;
  }

  async updateLabel(id, updates) {
    const label = this.cache.labels.find(l => l.id === id);
    if (!label) return null;
    Object.assign(label, updates);
    return label;
  }

  async deleteLabel(id) {
    this.cache.labels = this.cache.labels.filter(l => l.id !== id);
    for (const email of this.cache.emails) {
      email.labels = (email.labels || []).filter(l => l !== id);
    }
    return true;
  }

  async addContact(contact) {
    this.cache.contacts.push(contact);
    return contact;
  }

  async deleteContact(id) {
    this.cache.contacts = this.cache.contacts.filter(c => c.id !== id);
    return true;
  }

  async saveAttachment(id, base64Data) {
    this.cache.attachments[id] = base64Data;
  }

  async seedData(data) {
    if (data.emails) {
      for (const email of data.emails) {
        this.cache.emails.push(email);
      }
    }
    if (data.labels) {
      for (const label of data.labels) {
        this.cache.labels.push(label);
      }
    }
    if (data.contacts) {
      for (const contact of data.contacts) {
        this.cache.contacts.push(contact);
      }
    }
  }

  async reset() {
    this.cache = this._defaultData();
  }

  async persist() {}

  async close() {}
}

module.exports = Store;
