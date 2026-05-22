const pty = require('node-pty');

const ptyProcess = pty.spawn('npm', ['run', 'dev'], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.cwd(),
  env: process.env
});

ptyProcess.on('data', function(data) {
  process.stdout.write(data);
  if (data.includes('Is rotations_staffing_configurations_preferences table created or renamed from another table?')) {
    // Arrow down to rename, or just hit enter for create table?
    // "❯ + rotations_staffing_configurations_preferences                        create table"
    // "  ~ staffing_preferences › rotations_staffing_configurations_preferences rename table"
    // Let's just create table (hit enter)
    ptyProcess.write('\r');
  }
  if (data.includes('Is retired column in rotations table created or renamed from another column?')) {
    ptyProcess.write('\r');
  }
});
