const fs = require('fs');
const path = require('path');

class Store {
  constructor(filePath) {
    this.filePath = filePath;
    this.handle = null;
    this.cache = null;
    this.writeQueue = [];
    this.writing = false;
  }

  async init() {
    const dir = path.dirname(this.filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    let exists = true;
    try {
      await fs.promises.access(this.filePath);
    } catch {
      exists = false;
    }

    if (exists) {
      this.handle = await fs.promises.open(this.filePath, 'r+');
    } else {
      this.handle = await fs.promises.open(this.filePath, 'w+');
    }

    const stat = await this.handle.stat();
    if (stat.size > 0) {
      const buf = Buffer.alloc(stat.size);
      await this.handle.read(buf, 0, stat.size, 0);
      try {
        this.cache = JSON.parse(buf.toString('utf8'));
      } catch {
        this.cache = null;
      }
    }

    if (!this.cache || !this.cache.emails) {
      this.cache = this._defaultData();
      await this._flush();
    }

    // Ensure all expected keys exist
    if (!this.cache.attachments) this.cache.attachments = {};
    if (!this.cache.contacts) this.cache.contacts = [];
    if (!this.cache.labels) this.cache.labels = this._defaultData().labels;
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

  async _flush() {
    const data = JSON.stringify(this.cache);
    const buf = Buffer.from(data, 'utf8');
    await this.handle.truncate(0);
    await this.handle.write(buf, 0, buf.length, 0);
    await this.handle.datasync();
  }

  async persist() {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ resolve, reject });
      if (!this.writing) this._drain();
    });
  }

  async _drain() {
    this.writing = true;
    while (this.writeQueue.length > 0) {
      const batch = this.writeQueue.splice(0);
      try {
        await this._flush();
        for (const { resolve } of batch) resolve();
      } catch (err) {
        for (const { reject } of batch) reject(err);
      }
    }
    this.writing = false;
  }

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
    await this.persist();
    return email;
  }

  async updateEmail(id, updates) {
    const email = this.cache.emails.find(e => e.id === id);
    if (!email) return null;
    Object.assign(email, updates);
    await this.persist();
    return email;
  }

  async deleteEmail(id) {
    const idx = this.cache.emails.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.cache.emails.splice(idx, 1);
    await this.persist();
    return true;
  }

  async addLabel(label) {
    this.cache.labels.push(label);
    await this.persist();
    return label;
  }

  async updateLabel(id, updates) {
    const label = this.cache.labels.find(l => l.id === id);
    if (!label) return null;
    Object.assign(label, updates);
    await this.persist();
    return label;
  }

  async deleteLabel(id) {
    this.cache.labels = this.cache.labels.filter(l => l.id !== id);
    for (const email of this.cache.emails) {
      email.labels = (email.labels || []).filter(l => l !== id);
    }
    await this.persist();
    return true;
  }

  async addContact(contact) {
    this.cache.contacts.push(contact);
    await this.persist();
    return contact;
  }

  async deleteContact(id) {
    this.cache.contacts = this.cache.contacts.filter(c => c.id !== id);
    await this.persist();
    return true;
  }

  async saveAttachment(id, base64Data) {
    this.cache.attachments[id] = base64Data;
    await this.persist();
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
    await this.persist();
  }

  async reset() {
    this.cache = this._defaultData();
    await this.persist();
  }

  async close() {
    if (this.handle) {
      await this.handle.close();
      this.handle = null;
    }
  }
}

module.exports = Store;
