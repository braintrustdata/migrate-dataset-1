const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3002,
  dataDir: path.join(__dirname, '..', 'data'),
  get dataFile() { return path.join(this.dataDir, 'store.json'); },
  userEmail: 'me@gmail-clone.local',
  userName: 'Me',
};
