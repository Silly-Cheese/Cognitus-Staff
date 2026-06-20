import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { firebaseSettings } from './firebase-settings.js';

const app = initializeApp(firebaseSettings);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.querySelector('#app');

const OWNER_ID = 'COG-EXC-001';
const OWNER_USERNAME = 'Executive_Eagle';
const ACTIVE = ['Active', 'Training', 'On Leave'];
const statuses = ['Active', 'Training', 'On Leave', 'Suspended', 'Resigned', 'Terminated', 'Archived'];
const taskStatuses = ['Not Started', 'In Progress', 'Waiting Review', 'Completed', 'Rejected'];
const ticketStatuses = ['Open', 'Under Review', 'Waiting Response', 'Resolved', 'Closed'];
const priorities = ['Low', 'Normal', 'High', 'Critical'];
const ranks = [
  ['Founder / Chief Executive Officer', 8, 'Ownership'], ['Chief Operating Officer', 7, 'Executive'], ['Chief Compliance Officer', 7, 'Executive'],
  ['Department Director', 6, 'Department Leadership'], ['Deputy Director', 6, 'Department Leadership'], ['Division Manager', 5, 'Management'],
  ['Supervisor', 4, 'Supervision'], ['Senior Specialist', 3, 'Senior Staff'], ['Specialist', 2, 'Staff'], ['Associate', 2, 'Staff'], ['Trainee', 1, 'Trainee']
];
const departments = ['Executive Office', 'Human Resources', 'Accreditation Services', 'Records & Intelligence', 'Investigations', 'Operations', 'Technology', 'Public Relations'];
const state = { user: null, employee: null, page: 'dashboard', employees: [], tasks: [], tickets: [], audits: [], notice: '' };

const norm = value => String(value || '').trim().toLowerCase();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const can = level => Number(state.employee?.accessLevel || 0) >= level;
const today = () => new Date().toISOString().slice(0, 10);
const byId = (id, fallback = '') => document.querySelector(id)?.value ?? fallback;
function badge(value) {
  const text = esc(value || 'Unknown');
  const cls = /active|completed|resolved/i.test(text) ? 'green' : /training|review|waiting|progress|leave/i.test(text) ? 'yellow' : /suspend|terminated|rejected|closed|critical/i.test(text) ? 'red' : 'blue';
  return `<span class="badge ${cls}">${text}</span>`;
}
function rankByTitle(title) { return ranks.find(r => r[0] === title) || ranks[ranks.length - 1]; }
function employeeName(id) { const e = state.employees.find(x => x.employeeId === id); return e ? `${e.discordUsername} (${e.employeeId})` : id || 'Unassigned'; }

async function safeRun(action, success) {
  try { await action(); if (success) state.notice = success; await loadAll(); renderPortal(); }
  catch (error) { state.notice = `Action failed: ${error.message}`; renderPortal(); }
}
async function audit(action, details = {}) {
  try { await addDoc(collection(db, 'auditLogs'), { action, details, actorUid: state.user?.uid || 'system', actorEmployeeId: state.employee?.employeeId || 'SYSTEM', actorDiscordUsername: state.employee?.discordUsername || 'System', createdAt: serverTimestamp() }); } catch (error) { console.warn('Audit failed', error); }
}

async function ensureSession() {
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
async function bootstrapFounder() {
  const ref = doc(db, 'employees', OWNER_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, { employeeId: OWNER_ID, discordUsername: OWNER_USERNAME, discordUsernameLower: norm(OWNER_USERNAME), discordUserId: '', authUid: state.user.uid, displayName: 'Executive Eagle', rank: 'Founder / Chief Executive Officer', rankGroup: 'Ownership', department: 'Executive Office', accessLevel: 8, status: 'Active', supervisorId: null, hireDate: today(), createdBy: 'SYSTEM_BOOTSTRAP', updatedByEmployeeId: 'SYSTEM_BOOTSTRAP', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return true;
}
async function init() {
  try {
    root.innerHTML = `<section class="boot-screen"><div><div class="brand-mark">CS</div><h1>Cognitus Solutions</h1><p>Opening secure staff session...</p></div></section>`;
    state.user = await ensureSession();
    const created = await bootstrapFounder();
    const saved = localStorage.getItem('cognitusEmployeeId');
    if (saved) {
      const snap = await getDoc(doc(db, 'employees', saved));
      if (snap.exists() && snap.data().authUid === state.user.uid && ACTIVE.includes(snap.data().status)) {
        state.employee = snap.data(); await loadAll(); state.notice = created ? 'Founder account created automatically.' : ''; return renderPortal();
      }
    }
    renderLogin(created ? 'Founder account created. Login with Executive_Eagle and COG-EXC-001.' : '');
  } catch (error) { renderError(error); }
}
function renderError(error) { root.innerHTML = `<section class="login-page"><div class="login-card"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus Solutions</h1><p>Staff Portal</p></div></div><div class="notice error"><strong>Setup issue.</strong><br>${esc(error.message)}</div><p class="muted">Enable Firestore and Anonymous Authentication, check firebase-settings.js, then deploy firestore.rules.</p></div></section>`; }
function renderLogin(message = '') {
  root.innerHTML = `<section class="login-page"><div class="login-card"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus Solutions</h1><p>Employee Operations Portal</p></div></div>${message ? `<div class="notice success">${esc(message)}</div>` : ''}<div class="notice warn"><strong>No email collection.</strong><br>Employees use Discord Username and Employee ID. Firebase still keeps a secure browser session underneath.</div><form id="loginForm" class="form-grid"><label>Discord Username<input id="discordUsername" placeholder="Executive_Eagle" required></label><label>Employee ID<input id="employeeId" placeholder="COG-EXC-001" required></label><button class="primary-btn">Enter Staff Portal</button></form></div></section>`;
  document.querySelector('#loginForm').addEventListener('submit', login);
}
async function login(event) {
  event.preventDefault();
  try {
    state.user = await ensureSession();
    const username = norm(byId('#discordUsername'));
    const employeeId = byId('#employeeId').trim();
    const ref = doc(db, 'employees', employeeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return renderLogin('No employee record was found for that Employee ID.');
    const employee = snap.data();
    if (norm(employee.discordUsername) !== username) return renderLogin('The Discord Username does not match that Employee ID.');
    if (!ACTIVE.includes(employee.status)) return renderLogin('This employee account is not currently active.');
    const ownerRecovery = employeeId === OWNER_ID && norm(employee.discordUsername) === norm(OWNER_USERNAME);
    if (employee.authUid && employee.authUid !== state.user.uid && !ownerRecovery) return renderLogin('This employee record is already linked. Ask leadership to reset the auth link from Employee Management.');
    if (!employee.authUid || ownerRecovery) await updateDoc(ref, { authUid: state.user.uid, updatedAt: serverTimestamp() });
    state.employee = { ...employee, authUid: state.user.uid };
    localStorage.setItem('cognitusEmployeeId', employeeId);
    await audit('EMPLOYEE_LOGIN', { employeeId });
    await loadAll(); state.notice = 'Welcome back.'; renderPortal();
  } catch (error) { renderLogin(`Login failed: ${error.message}`); }
}

async function loadAll() {
  state.employees = (await getDocs(query(collection(db, 'employees'), orderBy('employeeId'), limit(250)))).docs.map(d => ({ id: d.id, ...d.data() }));
  state.tasks = (await getDocs(query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(200)))).docs.map(d => ({ id: d.id, ...d.data() }));
  state.tickets = (await getDocs(query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(200)))).docs.map(d => ({ id: d.id, ...d.data() }));
  state.audits = can(7) ? (await getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(125)))).docs.map(d => ({ id: d.id, ...d.data() })) : [];
}
function navItems() { return [['dashboard','Dashboard',1],['directory','Directory',2],['tasks','Tasks',2],['tickets','Tickets',1],['employees','Employees',6],['audits','Audit Logs',7],['ranks','Ranks',1]].filter(i => can(i[2])); }
function visibleTasks() { return can(5) ? state.tasks : state.tasks.filter(t => t.assignedToEmployeeId === state.employee.employeeId || t.createdByEmployeeId === state.employee.employeeId); }
function visibleTickets() { return can(6) ? state.tickets : state.tickets.filter(t => t.createdByEmployeeId === state.employee.employeeId || t.assignedToEmployeeId === state.employee.employeeId); }

function renderPortal() {
  const notice = state.notice; state.notice = '';
  root.innerHTML = `<div class="portal-layout"><aside class="sidebar"><div class="brand-row"><div class="brand-mark">CS</div><div><h1>Cognitus</h1><p>Staff Portal</p></div></div><nav class="nav-list">${navItems().map(([key,label]) => `<button class="nav-btn ${state.page === key ? 'active' : ''}" data-page="${key}">${label}</button>`).join('')}</nav><div class="sidebar-footer"><button id="logoutBtn" class="ghost-btn" style="width:100%">Sign Out</button></div></aside><main class="main"><div class="portal-topbar"><div><h2>${pageTitle()}</h2><p class="muted">${esc(state.employee.discordUsername)} • ${esc(state.employee.employeeId)} • ${esc(state.employee.rank)}</p></div><div class="topbar-actions">${badge(state.employee.status)}${badge('Level ' + state.employee.accessLevel)}</div></div>${notice ? `<div class="notice ${notice.startsWith('Action failed') ? 'error' : 'success'}">${esc(notice)}</div>` : ''}<section>${renderPage()}</section></main></div>`;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', async () => { state.page = btn.dataset.page; await loadAll(); renderPortal(); }));
  document.querySelector('#logoutBtn').addEventListener('click', () => { localStorage.removeItem('cognitusEmployeeId'); state.employee = null; state.page = 'dashboard'; renderLogin('You have signed out of the portal on this browser.'); });
  wireActions();
}
function pageTitle() { return ({ dashboard:'Command Dashboard', directory:'Employee Directory', tasks:'Task Center', tickets:'Internal Tickets', employees:'Manage Employees', audits:'Audit Logs', ranks:'Rank Structure' })[state.page] || 'Staff Portal'; }
function renderPage() { return state.page === 'directory' ? directoryPage() : state.page === 'tasks' ? tasksPage() : state.page === 'tickets' ? ticketsPage() : state.page === 'employees' ? employeesPage() : state.page === 'audits' ? auditsPage() : state.page === 'ranks' ? ranksPage() : dashboardPage(); }

function dashboardPage() {
  const active = state.employees.filter(e => e.status === 'Active').length;
  const openTasks = visibleTasks().filter(t => t.status !== 'Completed').length;
  const openTickets = visibleTickets().filter(t => !['Resolved','Closed'].includes(t.status)).length;
  return `<div class="grid four"><div class="stat-card"><p>Active Employees</p><strong>${active}</strong></div><div class="stat-card"><p>Visible Tasks</p><strong>${visibleTasks().length}</strong></div><div class="stat-card"><p>Open Tasks</p><strong>${openTasks}</strong></div><div class="stat-card"><p>Open Tickets</p><strong>${openTickets}</strong></div></div><div class="grid two" style="margin-top:1rem"><section class="card"><h3>Your Profile</h3>${profile(state.employee)}</section><section class="card"><h3>Quick Actions</h3><div class="action-row"><button class="secondary-btn" data-jump="tasks">View Tasks</button><button class="secondary-btn" data-jump="tickets">Open Ticket</button>${can(6) ? '<button class="secondary-btn" data-jump="employees">Add Employee</button>' : ''}</div><hr><p class="muted">Black and white production theme is active. All major writes now show clear success or failure notices.</p></section></div><section class="card" style="margin-top:1rem"><h3>Recent Tasks</h3>${taskTable(visibleTasks().slice(0,5))}</section>`;
}
function profile(e) { return `<div class="table-wrap"><table><tbody><tr><th>Employee ID</th><td>${esc(e.employeeId)}</td></tr><tr><th>Discord</th><td>${esc(e.discordUsername)}</td></tr><tr><th>Department</th><td>${esc(e.department)}</td></tr><tr><th>Rank</th><td>${esc(e.rank)}</td></tr><tr><th>Status</th><td>${badge(e.status)}</td></tr><tr><th>Auth Link</th><td>${e.authUid ? badge('Linked') : badge('Not linked')}</td></tr></tbody></table></div>`; }

function filteredEmployees() {
  const term = norm(document.querySelector('#employeeSearch')?.value || '');
  if (!term) return state.employees;
  return state.employees.filter(e => norm(`${e.employeeId} ${e.discordUsername} ${e.department} ${e.rank} ${e.status}`).includes(term));
}
function directoryPage() { return `<div class="card"><div class="toolbar"><input id="employeeSearch" placeholder="Search employees..."><button class="secondary-btn" data-refresh>Refresh</button></div><h3>Employees</h3>${employeeTable(state.employees, false)}</div>`; }
function employeeTable(rows, manage) { if (!rows.length) return `<div class="empty-state">No employees found.</div>`; return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Discord</th><th>Department</th><th>Rank</th><th>Status</th><th>Auth</th>${manage ? '<th>Actions</th>' : ''}</tr></thead><tbody>${rows.map(e => `<tr><td>${esc(e.employeeId)}</td><td>${esc(e.discordUsername)}</td><td>${esc(e.department)}</td><td>${esc(e.rank)}</td><td>${badge(e.status)}</td><td>${e.authUid ? badge('Linked') : badge('Open')}</td>${manage ? `<td><div class="action-row"><select data-emp-status="${esc(e.employeeId)}">${statuses.map(s => `<option ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="small-btn" data-reset-auth="${esc(e.employeeId)}">Reset Link</button></div></td>` : ''}</tr>`).join('')}</tbody></table></div>`; }

function tasksPage() { return `<div class="grid two"><section class="card"><h3>Create Task</h3>${can(4) ? taskForm() : '<p class="muted">Supervisors and above can create tasks.</p>'}</section><section class="card"><div class="toolbar"><select id="taskFilter"><option value="">All Tasks</option>${taskStatuses.map(s => `<option>${s}</option>`).join('')}</select><button class="secondary-btn" data-refresh>Refresh</button></div><h3>Task Queue</h3>${taskTable(visibleTasks())}</section></div>`; }
function taskForm() { return `<form id="taskForm" class="form-grid"><label>Title<input id="taskTitle" required></label><label>Assign To<select id="taskAssignedTo">${state.employees.filter(e => ACTIVE.includes(e.status)).map(e => `<option value="${esc(e.employeeId)}">${esc(e.employeeId)} - ${esc(e.discordUsername)}</option>`).join('')}</select></label><label>Priority<select id="taskPriority">${priorities.map(p => `<option ${p === 'Normal' ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label>Due Date<input id="taskDue" type="date"></label><label>Description<textarea id="taskDescription"></textarea></label><button class="primary-btn">Create Task</button></form>`; }
function taskTable(rows) { const status = document.querySelector('#taskFilter')?.value || ''; const filtered = status ? rows.filter(t => t.status === status) : rows; if (!filtered.length) return `<div class="empty-state">No visible tasks yet.</div>`; return `<div class="table-wrap"><table><thead><tr><th>Task</th><th>Assigned</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead><tbody>${filtered.map(t => `<tr><td><strong>${esc(t.title)}</strong><br><span class="muted">${esc(t.description || 'No description')}</span></td><td>${esc(employeeName(t.assignedToEmployeeId))}</td><td>${badge(t.priority || 'Normal')}</td><td>${badge(t.status)}</td><td><select data-task-status="${t.id}">${taskStatuses.map(s => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`; }

function ticketsPage() { return `<div class="grid two"><section class="card"><h3>Open Internal Ticket</h3><form id="ticketForm" class="form-grid"><label>Category<select id="ticketCategory"><option>Human Resources</option><option>Technology</option><option>Operations</option><option>Management Review</option><option>Other</option></select></label><label>Subject<input id="ticketSubject" required></label><label>Details<textarea id="ticketDetails" required></textarea></label><button class="primary-btn">Submit Ticket</button></form></section><section class="card"><div class="toolbar"><select id="ticketFilter"><option value="">All Tickets</option>${ticketStatuses.map(s => `<option>${s}</option>`).join('')}</select><button class="secondary-btn" data-refresh>Refresh</button></div><h3>Ticket Queue</h3>${ticketTable(visibleTickets())}</section></div>`; }
function ticketTable(rows) { const status = document.querySelector('#ticketFilter')?.value || ''; const filtered = status ? rows.filter(t => t.status === status) : rows; if (!filtered.length) return `<div class="empty-state">No visible tickets yet.</div>`; return `<div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Created By</th><th>Status</th><th>Update</th></tr></thead><tbody>${filtered.map(t => `<tr><td><strong>${esc(t.subject)}</strong><br><span class="muted">${esc(t.category)} — ${esc(t.details || '')}</span></td><td>${esc(employeeName(t.createdByEmployeeId))}</td><td>${badge(t.status)}</td><td>${can(6) || t.createdByEmployeeId === state.employee.employeeId ? `<select data-ticket-status="${t.id}">${ticketStatuses.map(s => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : '—'}</td></tr>`).join('')}</tbody></table></div>`; }

function employeesPage() { return `<div class="grid two"><section class="card"><h3>Create Employee</h3><form id="employeeForm" class="form-grid"><label>Employee ID<input id="newEmployeeId" placeholder="COG-HR-001" required></label><label>Discord Username<input id="newDiscordUsername" required></label><label>Display Name<input id="newDisplayName"></label><label>Discord User ID Optional<input id="newDiscordUserId"></label><label>Department<select id="newDepartment">${departments.map(d => `<option>${d}</option>`).join('')}</select></label><label>Rank<select id="newRank">${ranks.map(r => `<option>${r[0]}</option>`).join('')}</select></label><label>Status<select id="newStatus">${statuses.map(s => `<option>${s}</option>`).join('')}</select></label><button class="primary-btn">Create Employee</button></form></section><section class="card"><div class="toolbar"><input id="employeeSearch" placeholder="Search employees..."><button class="secondary-btn" data-refresh>Refresh</button></div><h3>Employee Records</h3>${employeeTable(state.employees, true)}</section></div>`; }
function auditsPage() { if (!state.audits.length) return `<div class="card"><h3>Audit Logs</h3><div class="empty-state">No audit logs found.</div></div>`; return `<div class="card"><h3>Recent Audit Logs</h3><div class="table-wrap"><table><thead><tr><th>Action</th><th>Actor</th><th>Details</th></tr></thead><tbody>${state.audits.map(a => `<tr><td>${esc(a.action)}</td><td>${esc(a.actorDiscordUsername)}<br><span class="muted">${esc(a.actorEmployeeId)}</span></td><td><code>${esc(JSON.stringify(a.details || {}))}</code></td></tr>`).join('')}</tbody></table></div></div>`; }
function ranksPage() { return `<div class="grid two"><section class="card"><h3>Rank Structure</h3><div class="table-wrap"><table><thead><tr><th>Rank</th><th>Group</th><th>Access</th></tr></thead><tbody>${ranks.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[2])}</td><td>${badge('Level ' + r[1])}</td></tr>`).join('')}</tbody></table></div></section><section class="card"><h3>Departments</h3><div class="table-wrap"><table><tbody>${departments.map(d => `<tr><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div></section></div>`; }

function wireActions() {
  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', async () => { state.page = b.dataset.jump; await loadAll(); renderPortal(); }));
  document.querySelectorAll('[data-refresh]').forEach(b => b.addEventListener('click', async () => { await loadAll(); state.notice = 'Refreshed.'; renderPortal(); }));
  document.querySelector('#employeeSearch')?.addEventListener('input', e => { const box = e.target.closest('.card'); const table = box.querySelector('.table-wrap, .empty-state'); table.outerHTML = employeeTable(filteredEmployees(), state.page === 'employees'); wireActions(); });
  document.querySelector('#taskFilter')?.addEventListener('change', () => renderPortal());
  document.querySelector('#ticketFilter')?.addEventListener('change', () => renderPortal());
  document.querySelector('#taskForm')?.addEventListener('submit', createTask);
  document.querySelector('#ticketForm')?.addEventListener('submit', createTicket);
  document.querySelector('#employeeForm')?.addEventListener('submit', createEmployee);
  document.querySelectorAll('[data-task-status]').forEach(el => el.addEventListener('change', () => safeRun(async () => { await updateDoc(doc(db, 'tasks', el.dataset.taskStatus), { status: el.value, updatedAt: serverTimestamp(), updatedByEmployeeId: state.employee.employeeId }); await audit('TASK_STATUS_UPDATED', { taskId: el.dataset.taskStatus, status: el.value }); }, 'Task status updated.')));
  document.querySelectorAll('[data-ticket-status]').forEach(el => el.addEventListener('change', () => safeRun(async () => { await updateDoc(doc(db, 'tickets', el.dataset.ticketStatus), { status: el.value, updatedAt: serverTimestamp(), updatedByEmployeeId: state.employee.employeeId }); await audit('TICKET_STATUS_UPDATED', { ticketId: el.dataset.ticketStatus, status: el.value }); }, 'Ticket status updated.')));
  document.querySelectorAll('[data-emp-status]').forEach(el => el.addEventListener('change', () => safeRun(async () => { await updateDoc(doc(db, 'employees', el.dataset.empStatus), { status: el.value, updatedAt: serverTimestamp(), updatedByEmployeeId: state.employee.employeeId }); await audit('EMPLOYEE_STATUS_UPDATED', { employeeId: el.dataset.empStatus, status: el.value }); }, 'Employee status updated.')));
  document.querySelectorAll('[data-reset-auth]').forEach(btn => btn.addEventListener('click', () => safeRun(async () => { await updateDoc(doc(db, 'employees', btn.dataset.resetAuth), { authUid: null, updatedAt: serverTimestamp(), updatedByEmployeeId: state.employee.employeeId }); await audit('EMPLOYEE_AUTH_RESET', { employeeId: btn.dataset.resetAuth }); }, 'Employee auth link reset. They can claim the account again from their browser.')));
}
async function createTask(e) { e.preventDefault(); if (!can(4)) return; await safeRun(async () => { const assignedTo = byId('#taskAssignedTo'); await addDoc(collection(db, 'tasks'), { title: byId('#taskTitle').trim(), assignedToEmployeeId: assignedTo, priority: byId('#taskPriority'), dueDate: byId('#taskDue') || null, description: byId('#taskDescription').trim(), status: 'Not Started', createdByEmployeeId: state.employee.employeeId, updatedByEmployeeId: state.employee.employeeId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); await audit('TASK_CREATED', { assignedTo }); }, 'Task created.'); }
async function createTicket(e) { e.preventDefault(); await safeRun(async () => { await addDoc(collection(db, 'tickets'), { category: byId('#ticketCategory'), subject: byId('#ticketSubject').trim(), details: byId('#ticketDetails').trim(), status: 'Open', createdByEmployeeId: state.employee.employeeId, updatedByEmployeeId: state.employee.employeeId, assignedToEmployeeId: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); await audit('TICKET_CREATED', { category: byId('#ticketCategory') }); }, 'Ticket submitted.'); }
async function createEmployee(e) { e.preventDefault(); if (!can(6)) return; await safeRun(async () => { const employeeId = byId('#newEmployeeId').trim(); const discordUsername = byId('#newDiscordUsername').trim(); const rank = rankByTitle(byId('#newRank')); if ((await getDoc(doc(db, 'employees', employeeId))).exists()) throw new Error('That Employee ID already exists.'); await setDoc(doc(db, 'employees', employeeId), { employeeId, discordUsername, discordUsernameLower: norm(discordUsername), discordUserId: byId('#newDiscordUserId').trim(), authUid: null, displayName: byId('#newDisplayName').trim() || discordUsername, rank: rank[0], rankGroup: rank[2], department: byId('#newDepartment'), accessLevel: rank[1], status: byId('#newStatus'), supervisorId: state.employee.employeeId, hireDate: today(), createdBy: state.employee.employeeId, updatedByEmployeeId: state.employee.employeeId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); await audit('EMPLOYEE_CREATED', { employeeId, discordUsername, rank: rank[0] }); }, 'Employee created. They can now login with their Discord Username and Employee ID.'); }

init();
