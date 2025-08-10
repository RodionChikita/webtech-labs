import { getRoutes, getGuides, createOrder, calcPrice, paginate } from './api.js';

const PER_PAGE_ROUTES = 10;

let routes = [];
let routesPage = 1;
let selectedRoute = null;

let guides = [];
let selectedGuide = null;

function showAlert(message, type = 'success') {
  const id = `al-${Date.now()}`;
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.role = 'alert';
  el.id = id;
  el.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
  document.getElementById('alerts').appendChild(el);
  setTimeout(() => el.classList.contains('show') && el.remove(), 5000);
}

function uniqueMainObjects(data) {
  const set = new Set();
  data.forEach(r => String(r.mainObject || '').split('–').forEach(s => { const t = s.trim(); if (t) set.add(t); }));
  return Array.from(set).sort();
}

function applyRouteFilters() {
  const name = document.getElementById('routeName').value.trim().toLowerCase();
  const obj = document.getElementById('routeObject').value.trim();
  let list = routes.filter(r => true);
  if (name) list = list.filter(r => r.name.toLowerCase().includes(name));
  if (obj) list = list.filter(r => String(r.mainObject || '').includes(obj));
  return list;
}

function renderRoutes() {
  const list = applyRouteFilters();
  const paged = paginate(list, routesPage, PER_PAGE_ROUTES);
  const tbody = document.getElementById('routesTbody');
  tbody.innerHTML = '';
  paged.forEach(r => {
    const tr = document.createElement('tr');
    tr.className = selectedRoute && selectedRoute.id === r.id ? 'table-primary' : '';
    tr.innerHTML = `<td><div class="fw-semibold">${r.name}</div></td>
      <td><div class="text-truncate" style="max-width:420px" title="${r.description}">${r.description}</div></td>
      <td><div class="small text-body-secondary" title="${r.mainObject}">${r.mainObject}</div></td>
      <td class="text-end"><button class="btn btn-sm btn-outline-primary select-route" data-id="${r.id}">Выбрать</button></td>`;
    tbody.appendChild(tr);
  });
  renderRoutesPager(list.length);
}

function renderRoutesPager(total) {
  const pages = Math.max(1, Math.ceil(total / PER_PAGE_ROUTES));
  routesPage = Math.min(routesPage, pages);
  const ul = document.getElementById('routesPager');
  ul.innerHTML = '';
  for (let p = 1; p <= pages; p += 1) {
    const li = document.createElement('li');
    li.className = `page-item ${p === routesPage ? 'active' : ''}`;
    li.innerHTML = `<button class="page-link" data-p="${p}">${p}</button>`;
    ul.appendChild(li);
  }
}

function populateRouteObjectSelect() {
  const sel = document.getElementById('routeObject');
  const opts = uniqueMainObjects(routes);
  opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; sel.appendChild(op); });
}

function selectRoute(routeId) {
  selectedRoute = routes.find(r => r.id == routeId) || null;
  document.getElementById('selectedRouteTitle').textContent = selectedRoute ? selectedRoute.name : '';
  document.getElementById('guides').classList.toggle('d-none', !selectedRoute);
  selectedGuide = null;
  document.getElementById('openOrderBtn').disabled = true;
  if (selectedRoute) loadGuides();
  renderRoutes();
}

function applyGuideFilters() {
  const lang = document.getElementById('guideLanguage').value;
  const expMin = Number(document.getElementById('expMin').value || -Infinity);
  const expMax = Number(document.getElementById('expMax').value || Infinity);
  return guides.filter(g => (!lang || String(g.language) === lang) && g.workExperience >= expMin && g.workExperience <= expMax);
}

function populateGuideLanguageSelect() {
  const sel = document.getElementById('guideLanguage');
  sel.innerHTML = '<option value="">Не выбрано</option>';
  const langs = Array.from(new Set(guides.map(g => g.language))).sort();
  langs.forEach(l => { const op = document.createElement('option'); op.value = l; op.textContent = l; sel.appendChild(op); });
}

function renderGuides() {
  const list = applyGuideFilters();
  const tbody = document.getElementById('guidesTbody');
  tbody.innerHTML = '';
  list.forEach(g => {
    const tr = document.createElement('tr');
    tr.className = selectedGuide && selectedGuide.id === g.id ? 'table-primary' : '';
    tr.innerHTML = `<td><div class="rounded bg-body-tertiary" style="width:60px;height:60px"></div></td>
      <td>${g.name}</td>
      <td>${g.language}</td>
      <td>${g.workExperience} лет</td>
      <td>${g.pricePerHour} ₽</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-primary select-guide" data-id="${g.id}">Выбрать</button></td>`;
    tbody.appendChild(tr);
  });
}

async function loadRoutes() {
  try {
    routes = await getRoutes();
    populateRouteObjectSelect();
    renderRoutes();
  } catch (e) {
    showAlert('Не удалось загрузить маршруты', 'danger');
  }
}

async function loadGuides() {
  try {
    guides = await getGuides(selectedRoute.id);
    populateGuideLanguageSelect();
    renderGuides();
  } catch (e) {
    showAlert('Не удалось загрузить гидов', 'danger');
  }
}

function updateOrderPrice() {
  if (!selectedGuide || !selectedRoute) { document.getElementById('orderPrice').textContent = '0 ₽'; return; }
  const date = document.getElementById('orderDate').value;
  const time = document.getElementById('orderTime').value;
  const hoursNumber = Number(document.getElementById('orderDuration').value);
  const persons = Number(document.getElementById('orderPersons').value);
  const optionFirst = document.getElementById('optionStudent').checked;
  const optionSecond = document.getElementById('optionPensioner').checked;
  const price = calcPrice({ guideServiceCost: selectedGuide.pricePerHour, hoursNumber, date, time, persons, optionFirst, optionSecond });
  document.getElementById('orderPrice').textContent = `${price} ₽`;
}

function openOrderModal() {
  document.getElementById('orderRoute').value = selectedRoute.name;
  document.getElementById('orderGuide').value = selectedGuide.name;
  updateOrderPrice();
  const m = new bootstrap.Modal(document.getElementById('orderModal'));
  m.show();
}

async function submitOrder(e) {
  e.preventDefault();
  try {
    const date = document.getElementById('orderDate').value;
    const time = document.getElementById('orderTime').value + ':00';
    const duration = Number(document.getElementById('orderDuration').value);
    const persons = Number(document.getElementById('orderPersons').value);
    const optionFirst = document.getElementById('optionStudent').checked ? 1 : 0;
    const optionSecond = document.getElementById('optionPensioner').checked ? 1 : 0;
    const price = Number(document.getElementById('orderPrice').textContent.replace(/\D/g, ''));
    const payload = {
      guide_id: selectedGuide.id,
      route_id: selectedRoute.id,
      date, time, duration, persons,
      price,
      optionFirst, optionSecond,
    };
    const res = await createOrder(payload);
    if (res && res.id) {
      showAlert('Заявка успешно оформлена');
      bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
      (document.getElementById('orderForm')).reset();
    } else {
      throw new Error();
    }
  } catch (e) {
    showAlert('Ошибка при оформлении заявки', 'danger');
  }
}

function bindUI() {
  document.getElementById('routesPager').addEventListener('click', (e) => {
    const p = e.target.getAttribute('data-p');
    if (p) { routesPage = Number(p); renderRoutes(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.getElementById('routesTbody').addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    if (e.target.classList.contains('select-route') && id) selectRoute(id);
  });
  document.getElementById('routeName').addEventListener('input', () => { routesPage = 1; renderRoutes(); });
  document.getElementById('routeObject').addEventListener('change', () => { routesPage = 1; renderRoutes(); });
  document.getElementById('routesReset').addEventListener('click', () => { document.getElementById('routeName').value=''; document.getElementById('routeObject').value=''; routesPage=1; renderRoutes(); });

  document.getElementById('guidesTbody').addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    if (e.target.classList.contains('select-guide') && id) {
      selectedGuide = guides.find(g => g.id == id) || null;
      document.getElementById('openOrderBtn').disabled = !selectedGuide;
      renderGuides();
    }
  });
  document.getElementById('guideLanguage').addEventListener('change', renderGuides);
  ['expMin','expMax'].forEach(id => document.getElementById(id).addEventListener('input', renderGuides));
  document.getElementById('guidesReset').addEventListener('click', () => { document.getElementById('guideLanguage').value=''; document.getElementById('expMin').value=''; document.getElementById('expMax').value=''; renderGuides(); });

  document.getElementById('openOrderBtn').addEventListener('click', openOrderModal);
  ['orderDate','orderTime','orderDuration','orderPersons','optionStudent','optionPensioner'].forEach(id => document.getElementById(id).addEventListener('input', updateOrderPrice));
  document.getElementById('orderForm').addEventListener('submit', submitOrder);
}

window.addEventListener('DOMContentLoaded', () => { loadRoutes(); bindUI(); }); 