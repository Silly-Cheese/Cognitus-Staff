const root = document.querySelector('#app');

const ranks = [
  ['Founder / Chief Executive Officer', 8, 'Ownership'],
  ['Chief Operating Officer', 7, 'Executive'],
  ['Chief Compliance Officer', 7, 'Executive'],
  ['Department Director', 6, 'Department Leadership'],
  ['Deputy Director', 6, 'Department Leadership'],
  ['Division Manager', 5, 'Management'],
  ['Supervisor', 4, 'Supervision'],
  ['Senior Specialist', 3, 'Senior Staff'],
  ['Specialist', 2, 'Staff'],
  ['Associate', 2, 'Staff'],
  ['Trainee', 1, 'Trainee']
];

const departments = [
  'Executive Office',
  'Human Resources',
  'Accreditation Services',
  'Records & Intelligence',
  'Investigations',
  'Operations',
  'Technology',
  'Public Relations'
];

const founderRecord = {
  discordUsername: 'Executive_Eagle',
  employeeId: 'COG-EXC-001',
  rank: 'Founder / Chief Executive Officer',
  department: 'Executive Office',
  accessLevel: 8,
  status: 'Active'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;' }[c]));
}

function badge(value) {
  return `<span class="badge blue">${esc(value)}</span>`;
}

function render() {
  root.innerHTML = `
    <div class="portal-layout">
      <aside class="sidebar">
        <div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus</h1><p>Staff Portal</p></div></div>
        <nav class="nav-list">
          <button class="nav-btn active">Dashboard</button>
          <button class="nav-btn">Directory</button>
          <button class="nav-btn">Tasks</button>
          <button class="nav-btn">Tickets</button>
          <button class="nav-btn">Employees</button>
          <button class="nav-btn">Audit Logs</button>
        </nav>
      </aside>
      <main class="main">
        <div class="portal-topbar">
          <div><h2>Command Dashboard</h2><p class="muted">Cognitus Solutions employee operations foundation</p></div>
          <div class="topbar-actions">${badge('Starter Build')}${badge('Firestore Ready')}</div>
        </div>

        <div class="notice warn"><strong>Next setup step:</strong><br>Add your Firebase settings in a local settings file, then connect the portal script to Firestore. The full no-email employee structure is already documented in this repo.</div>

        <div class="grid four">
          <div class="stat-card"><p>Founder Account</p><strong>1</strong></div>
          <div class="stat-card"><p>Access Levels</p><strong>9</strong></div>
          <div class="stat-card"><p>Departments</p><strong>${departments.length}</strong></div>
          <div class="stat-card"><p>Core Areas</p><strong>6</strong></div>
        </div>

        <div class="grid two" style="margin-top:1rem">
          <section class="card"><h3>Founder Bootstrap Record</h3><div class="table-wrap"><table><tbody>${Object.entries(founderRecord).map(([k,v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div></section>
          <section class="card"><h3>Departments</h3><div class="table-wrap"><table><tbody>${departments.map(d => `<tr><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div></section>
        </div>

        <section class="card" style="margin-top:1rem"><h3>Rank Structure</h3><div class="table-wrap"><table><thead><tr><th>Rank</th><th>Group</th><th>Access</th></tr></thead><tbody>${ranks.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[2])}</td><td>${badge('Level ' + r[1])}</td></tr>`).join('')}</tbody></table></div></section>
      </main>
    </div>`;
}

render();
