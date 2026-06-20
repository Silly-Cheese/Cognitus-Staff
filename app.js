import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { firebaseSettings } from './firebase-settings.js';

const firebaseApp = initializeApp(firebaseSettings);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
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

const departments = ['Executive Office', 'Human Resources', 'Accreditation Services', 'Records & Intelligence', 'Investigations', 'Operations', 'Technology', 'Public Relations'];

function esc(value) {
  return String(value ?? '').replace(/[&<>']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;' }[c]));
}

function badge(value) {
  return `<span class="badge blue">${esc(value)}</span>`;
}

async function render() {
  try {
    await signInAnonymously(auth);
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
          <div class="portal-topbar"><div><h2>Command Dashboard</h2><p class="muted">Firebase connected. Firestore ready.</p></div><div class="topbar-actions">${badge('Firebase Online')}${badge('Auth Session Active')}</div></div>
          <div class="notice success"><strong>Firebase wiring is active.</strong><br>The app initialized Firebase, Firestore, and a Firebase Auth session.</div>
          <div class="grid four"><div class="stat-card"><p>Owner Record</p><strong>COG</strong></div><div class="stat-card"><p>Access Levels</p><strong>9</strong></div><div class="stat-card"><p>Departments</p><strong>${departments.length}</strong></div><div class="stat-card"><p>Ranks</p><strong>${ranks.length}</strong></div></div>
        </main>
      </div>`;
  } catch (error) {
    root.innerHTML = `<section class="login-page"><div class="login-card"><h1>Cognitus Solutions</h1><div class="notice error">${esc(error.message)}</div></div></section>`;
  }
}

render();
