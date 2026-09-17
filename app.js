const STORAGE_KEY = 'asst-tigtoger-tasks-v1';
let tasks = loadTasks();
let activeFilter = 'all';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function todayKey(date = new Date()) { return date.toISOString().slice(0, 10); }
function formatDate(iso) {
  const date = new Date(iso + 'T12:00:00');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function visibleTasks() {
  if (activeFilter === 'completed') return tasks.filter(t => t.completed);
  if (activeFilter === 'today') return tasks.filter(t => t.createdAt === todayKey() && !t.completed);
  return tasks;
}
function render() {
  const list = document.querySelector('#task-list');
  const empty = document.querySelector('#empty-state');
  const shown = visibleTasks();
  list.innerHTML = shown.map(task => `
    <article class="task ${task.completed ? 'done' : ''}" data-id="${task.id}">
      <button class="check" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">${task.completed ? '✓' : ''}</button>
      <div class="task-body"><span class="task-title">${escapeHtml(task.title)}</span><div class="task-meta">${task.createdAt === todayKey() ? 'Today' : formatDate(task.createdAt)}</div></div>
      <span class="priority ${task.priority}">${task.priority}</span>
      <button class="delete-task" aria-label="Delete task">×</button>
    </article>`).join('');
  empty.hidden = shown.length !== 0;
  const completed = tasks.filter(t => t.completed).length;
  const today = tasks.filter(t => t.createdAt === todayKey() && !t.completed).length;
  document.querySelector('#all-count').textContent = tasks.length;
  document.querySelector('#today-count').textContent = today;
  document.querySelector('#completed-count').textContent = completed;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  document.querySelector('#progress-text').textContent = `${completed} of ${tasks.length} completed`;
  document.querySelector('#progress-percent').textContent = `${percent}%`;
  document.querySelector('#progress-bar').style.width = `${percent}%`;
  document.querySelectorAll('[data-filter]').forEach(el => el.classList.toggle('active', el.dataset.filter === activeFilter));
}
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

document.querySelector('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#task-input');
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), title, priority: document.querySelector('#priority-input').value, completed: false, createdAt: todayKey() });
  saveTasks(); input.value = ''; input.focus(); render();
});
document.addEventListener('click', event => {
  const filter = event.target.closest('[data-filter]');
  if (filter) { activeFilter = filter.dataset.filter; render(); return; }
  const task = event.target.closest('.task');
  if (task && event.target.closest('.check')) { const item = tasks.find(t => t.id === task.dataset.id); item.completed = !item.completed; saveTasks(); render(); }
  if (task && event.target.closest('.delete-task')) { tasks = tasks.filter(t => t.id !== task.dataset.id); saveTasks(); render(); }
});
document.querySelector('#clear-completed').addEventListener('click', () => { tasks = tasks.filter(t => !t.completed); saveTasks(); render(); });
document.querySelector('#clear-all').addEventListener('click', () => { if (tasks.length && confirm('Delete all tasks?')) { tasks = []; saveTasks(); render(); } });
render();
