const portalLinks = [
  { href: 'learning.html', label: 'Learning Portal' },
  { href: 'assignments.html', label: 'Training Assignments' },
  { href: 'employee-edit.html', label: 'Employee Editor' }
];

function wirePortalLinks() {
  const nav = document.querySelector('.nav-list');
  if (!nav || nav.dataset.extraLinks === 'true') return;
  portalLinks.forEach(link => {
    const a = document.createElement('a');
    a.className = 'nav-btn';
    a.href = link.href;
    a.textContent = link.label;
    nav.appendChild(a);
  });
  nav.dataset.extraLinks = 'true';
}

const observer = new MutationObserver(wirePortalLinks);
observer.observe(document.body, { childList: true, subtree: true });
wirePortalLinks();
