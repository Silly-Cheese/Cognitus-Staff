import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth, signInAnonymously, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { firebaseSettings } from './firebase-settings.js';

const firebaseApp = initializeApp(firebaseSettings);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const root = document.querySelector('#app');

const OWNER_ID = 'COG-EXC-001';
const OWNER_USERNAME = 'Executive_Eagle';
const ACTIVE = ['Active', 'Training', 'On Leave'];
const ranks = [
  ['Founder / Chief Executive Officer', 8, 'Ownership'], ['Chief Operating Officer', 7, 'Executive'], ['Chief Compliance Officer', 7, 'Executive'],
  ['Department Director', 6, 'Department Leadership'], ['Deputy Director', 6, 'Department Leadership'], ['Division Manager', 5, 'Management'],
  ['Supervisor', 4, 'Supervision'], ['Senior Specialist', 3, 'Senior Staff'], ['Specialist', 2, 'Staff'], ['Associate', 2, 'Staff'], ['Trainee', 1, 'Trainee']
];
const departments = ['Executive Office', 'Human Resources', 'Accreditation Services', 'Records & Intelligence', 'Investigations', 'Operations', 'Technology', 'Public Relations'];
const state = { user: null, employee: null, employees: [] };

const norm = value => String(value || '').trim().toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;' }[c]));
const can = level => Number(state.employee?.accessLevel || 0) >= level;
const today = () => new Date().toISOString().slice(0, 10);
function badge(value) { return `<span class="badge blue">${esc(value)}</span>`; }

async function audit(action, details = {}) {
  try { await addDoc(collection(db, 'auditLogs'), { action, details, actorUid: state.user?.uid || 'system', actorEmployeeId: state.employee?.employeeId || 'SYSTEM', actorDiscordUsername: state.employee?.discordUsername || 'System', createdAt: serverTimestamp() }); } catch (error) { console.warn(error); }
}

async function bootstrapFounder() {
  const ref = doc(db, 'employees', OWNER_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, {
    employeeId: OWNER_ID, discordUsername: OWNER_USERNAME, discordUsernameLower: norm(OWNER_USERNAME), discordUserId: '', authUid: state.user.uid,
    displayName: 'Executive Eagle', rank: 'Founder / Chief Executive Officer', rankGroup: 'Ownership', department: 'Executive Office', accessLevel: 8,
    status: 'Active', supervisorId: null, hireDate: today(), createdBy: 'SYSTEM_BOOTSTRAP', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return true;
}

async function init() {
  try {
    root.innerHTML = `<section class="boot-screen"><div><div class="brand-mark">CS</div><h1>Cognitus Solutions</h1><p>Opening secure staff session...</p></div></section>`;
    state.user = (await signInAnonymously(auth)).user;
    const created = await bootstrapFounder();
    const saved = localStorage.getItem('cognitusEmployeeId');
    if (saved) {
      const snap = await getDoc(doc(db, 'employees', saved));
      if (snap.exists() && snap.data().authUid === state.user.uid && ACTIVE.includes(snap.data().status)) {
        state.employee = snap.data(); await loadEmployees(); return renderPortal(created ? 'Founder account created automatically.' : '');
      }
    }
    renderLogin(created ? 'Founder account created. Login with Executive_Eagle and COG-EXC-001.' : '');
  } catch (error) { renderError(error); }
}

function renderError(error) {
  root.innerHTML = `<section class="login-page"><div class="login-card"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus Solutions</h1><p>Staff Portal</p></div></div><div class="notice error"><strong>Firebase setup issue.</strong><br>${esc(error.message)}</div><p class="muted">Enable Firestore and Anonymous Authentication, create firebase-settings.js, and deploy firestore.rules.</p></div></section>`;
}

function renderLogin(message = '') {
  root.innerHTML = `<section class="login-page"><div class="login-card"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus Solutions</h1><p>Employee Operations Portal</p></div></div>${message ? `<div class="notice success">${esc(message)}</div>` : ''}<div class="notice warn"><strong>No email collection.</strong><br>Employees use Discord Username and Employee ID. Firestore is protected by a Firebase session underneath.</div><form id="loginForm" class="form-grid"><label>Discord Username<input id="discordUsername" placeholder="Executive_Eagle" required></label><label>Employee ID<input id="employeeId" placeholder="COG-EXC-001" required></label><button class="primary-btn">Enter Staff Portal</button></form></div></section>`;
  document.querySelector('#loginForm').addEventListener('submit', login);
}

async function login(event) {
  event.preventDefault();
  const username = norm(document.querySelector('#discordUsername').value);
  const employeeId = document.querySelector('#employeeId').value.trim();
  const ref = doc(db, 'employees', employeeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return renderLogin('No employee record was found for that Employee ID.');
  const employee = snap.data();
  if (norm(employee.discordUsername) !== username) return renderLogin('The Discord Username does not match that Employee ID.');
  if (!ACTIVE.includes(employee.status)) return renderLogin('This employee account is not currently active.');
  if (employee.authUid && employee.authUid !== state.user.uid) return renderLogin('This employee record is already linked. Ask leadership to reset the auth link.');
  if (!employee.authUid) await updateDoc(ref, { authUid: state.user.uid, updatedAt: serverTimestamp() });
  state.employee = { ...employee, authUid: state.user.uid };
  localStorage.setItem('cognitusEmployeeId', employeeId);
  await audit('EMPLOYEE_LOGIN', { employeeId });
  await loadEmployees();
  renderPortal();
}

async function loadEmployees() {
  state.employees = (await getDocs(query(collection(db, 'employees'), orderBy('employeeId'), limit(250)))).docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderPortal(message = '') {
  root.innerHTML = `<div class="portal-layout"><aside class="sidebar"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus</h1><p>Staff Portal</p></div></div><nav class="nav-list"><button class="nav-btn active">Dashboard</button><button class="nav-btn">Directory</button><button class="nav-btn">Tasks</button><button class="nav-btn">Tickets</button>${can(6) ? '<button class="nav-btn">Employees</button>' : ''}${can(7) ? '<button class="nav-btn">Audit Logs</button>' : ''}</nav><div class="sidebar-footer"><button id="logoutBtn" class="ghost-btn" style="width:100%">Sign Out</button></div></aside><main class="main"><div class="portal-topbar"><div><h2>Command Dashboard</h2><p class="muted">${esc(state.employee.discordUsername)} • ${esc(state.employee.employeeId)} • ${esc(state.employee.rank)}</p></div><div class="topbar-actions">${badge(state.employee.status)}${badge('Access Level ' + state.employee.accessLevel)}</div></div>${message ? `<div class="notice success">${esc(message)}</div>` : ''}<div class="grid four"><div class="stat-card"><p>Employees</p><strong>${state.employees.length}</strong></div><div class="stat-card"><p>Departments</p><strong>${departments.length}</strong></div><div class="stat-card"><p>Ranks</p><strong>${ranks.length}</strong></div><div class="stat-card"><p>Access</p><strong>${esc(state.employee.accessLevel)}</strong></div></div><div class="grid two" style="margin-top:1rem"><section class="card"><h3>Your Profile</h3>${profile(state.employee)}</section><section class="card"><h3>Employee Directory</h3>${employeeTable()}</section></div><section class="card" style="margin-top:1rem"><h3>Rank Structure</h3>${rankTable()}</section></main></div>`;
  document.querySelector('#logoutBtn').addEventListener('click', async () => { localStorage.removeItem('cognitusEmployeeId'); await signOut(auth); location.reload(); });
}

function profile(e) { return `<div class="table-wrap"><table><tbody><tr><th>Employee ID</th><td>${esc(e.employeeId)}</td></tr><tr><th>Discord</th><td>${esc(e.discordUsername)}</td></tr><tr><th>Department</th><td>${esc(e.department)}</td></tr><tr><th>Rank</th><td>${esc(e.rank)}</td></tr><tr><th>Status</th><td>${badge(e.status)}</td></tr></tbody></table></div>`; }
function employeeTable() { return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Discord</th><th>Department</th><th>Rank</th><th>Status</th></tr></thead><tbody>${state.employees.map(e => `<tr><td>${esc(e.employeeId)}</td><td>${esc(e.discordUsername)}</td><td>${esc(e.department)}</td><td>${esc(e.rank)}</td><td>${badge(e.status)}</td></tr>`).join('')}</tbody></table></div>`; }
function rankTable() { return `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Group</th><th>Access</th></tr></thead><tbody>${ranks.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[2])}</td><td>${badge('Level ' + r[1])}</td></tr>`).join('')}</tbody></table></div>`; }

init();
