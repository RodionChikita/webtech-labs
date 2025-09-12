import { getOrders, getOrder, updateOrder, deleteOrder, paginate, getGuide, getRoutes } from './api.js';

const PER_PAGE_ORDERS = 5;
let orders = [];
let ordersPage = 1;
let currentDeleteId = null;

function showAlert(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.role = 'alert';
  el.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.getElementById('alerts').appendChild(el);
  setTimeout(() => el.classList.contains('show') && el.remove(), 5000);
}

async function renderOrders() {
  const tbody = document.getElementById('ordersTbody');
  tbody.innerHTML = '';
  // Получаем названия маршрутов разово на отрисовку (без кэша между экранами)
  let routesMap = new Map();
  try {
    const routes = await getRoutes();
    routesMap = new Map(routes.map(r => [r.id, r.name]));
  } catch (_) { routesMap = new Map(); }

  const list = paginate(orders, ordersPage, PER_PAGE_ORDERS);
  list.forEach((o, idx) => {
    const tr = document.createElement('tr');
    const seq = (ordersPage - 1) * PER_PAGE_ORDERS + idx + 1;
    const routeTitle = routesMap.get(o.route_id) || o.route_id;
    tr.innerHTML = `<td>${seq}</td><td>${routeTitle}</td><td>${o.date} ${o.time?.slice(0,5) || ''}</td><td>${o.price} ₽</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary view" data-id="${o.id}"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-primary edit" data-id="${o.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger del" data-id="${o.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
  renderPager();
}

function renderPager() {
  const ul = document.getElementById('ordersPager');
  const pages = Math.max(1, Math.ceil(orders.length / PER_PAGE_ORDERS));
  ordersPage = Math.min(ordersPage, pages);
  ul.innerHTML = '';
  for (let p = 1; p <= pages; p += 1) {
    const li = document.createElement('li');
    li.className = `page-item ${p === ordersPage ? 'active' : ''}`;
    li.innerHTML = `<button class="page-link" data-p="${p}">${p}</button>`;
    ul.appendChild(li);
  }
}

async function loadOrders() {
  try {
    orders = await getOrders();
    await renderOrders();
  } catch (e) { showAlert('Не удалось загрузить заявки', 'danger'); }
}

async function openView(id) {
  try {
    const o = await getOrder(id);
    const guide = await getGuide(o.guide_id);
    const routes = await getRoutes();
    const routesMap = new Map(routes.map(r => [r.id, r.name]));
    const routeTitle = routesMap.get(o.route_id) || o.route_id;
    const guideName = guide?.name || o.guide_id;
    const c = document.getElementById('viewContent');
    c.innerHTML = `<div class="row g-2">
      <div class="col-md-6"><strong>Маршрут:</strong> ${routeTitle}</div>
      <div class="col-md-6"><strong>Гид:</strong> ${guideName}</div>
      <div class="col-md-4"><strong>Дата:</strong> ${o.date}</div>
      <div class="col-md-4"><strong>Время:</strong> ${o.time?.slice(0,5) || ''}</div>
      <div class="col-md-4"><strong>Длительность:</strong> ${o.duration} ч</div>
      <div class="col-md-4"><strong>Группа:</strong> ${o.persons}</div>
      <div class="col-md-4"><strong>Опция 1:</strong> ${o.optionFirst ? 'Да' : 'Нет'}</div>
      <div class="col-md-4"><strong>Опция 2:</strong> ${o.optionSecond ? 'Да' : 'Нет'}</div>
      <div class="col-12"><strong>Стоимость:</strong> ${o.price} ₽</div>
    </div>`;
    new bootstrap.Modal('#viewModal').show();
  } catch(e) { showAlert('Не удалось получить заявку', 'danger'); }
}

async function openEdit(id) {
  try {
    const o = await getOrder(id);
    document.getElementById('editId').value = o.id;
    document.getElementById('editDate').value = o.date;
    document.getElementById('editTime').value = (o.time || '').slice(0,5);
    document.getElementById('editDuration').value = o.duration;
    document.getElementById('editPersons').value = o.persons;
    document.getElementById('editOpt1').checked = !!o.optionFirst;
    document.getElementById('editOpt2').checked = !!o.optionSecond;
    new bootstrap.Modal('#editModal').show();
  } catch(e) { showAlert('Не удалось открыть форму редактирования', 'danger'); }
}

async function submitEdit(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const patch = {
    date: document.getElementById('editDate').value,
    time: document.getElementById('editTime').value + ':00',
    duration: Number(document.getElementById('editDuration').value),
    persons: Number(document.getElementById('editPersons').value),
    optionFirst: document.getElementById('editOpt1').checked ? 1 : 0,
    optionSecond: document.getElementById('editOpt2').checked ? 1 : 0,
  };
  try {
    await updateOrder(id, patch);
    showAlert('Заявка обновлена');
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    await loadOrders();
  } catch(e) { showAlert('Ошибка при обновлении', 'danger'); }
}

function openDelete(id) { currentDeleteId = id; new bootstrap.Modal('#deleteModal').show(); }

async function confirmDelete() {
  if (!currentDeleteId) return;
  try { await deleteOrder(currentDeleteId); showAlert('Заявка удалена'); await loadOrders(); }
  catch(e) { showAlert('Ошибка при удалении', 'danger'); }
  finally { bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide(); currentDeleteId = null; }
}

function bindUI() {
  document.getElementById('ordersPager').addEventListener('click', async (e) => { const p = e.target.getAttribute('data-p'); if (p) { ordersPage=Number(p); await renderOrders(); } });
  document.getElementById('ordersTbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    const id = btn?.getAttribute('data-id');
    if (!id) return;
    if (btn.classList.contains('view')) openView(id);
    else if (btn.classList.contains('edit')) openEdit(id);
    else if (btn.classList.contains('del')) openDelete(id);
  });
  document.getElementById('editForm').addEventListener('submit', submitEdit);
  document.getElementById('deleteYes').addEventListener('click', confirmDelete);
}

window.addEventListener('DOMContentLoaded', () => { bindUI(); loadOrders(); }); 