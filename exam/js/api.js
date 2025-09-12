const API_BASE = 'http://exam-2023-1-api.std-900.ist.mospolytech.ru/api';
const API_KEY = '9f4cde62-7236-43ac-84c0-ce4162623d89';
const STUDENT_ID = 10700;

function buildUrl(path, params = {}) {
  const url = new URL(API_BASE + path);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  return url;
}

export async function getRoutes() {
  const res = await fetch(buildUrl('/routes'));
  return res.json();
}
export async function getGuides(routeId) {
  const res = await fetch(buildUrl(`/routes/${routeId}/guides`));
  return res.json();
}
export async function getOrders() {
  const res = await fetch(buildUrl('/orders', { student_id: STUDENT_ID }));
  return res.json();
}
export async function createOrder(formDataObj) {
  const fd = new FormData();
  Object.entries({ ...formDataObj, student_id: STUDENT_ID }).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(buildUrl('/orders'), { method: 'POST', body: fd });
  return res.json();
}
export async function updateOrder(orderId, patchObj) {
  const fd = new FormData();
  Object.entries(patchObj).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(buildUrl(`/orders/${orderId}`), { method: 'PUT', body: fd });
  return res.json();
}
export async function deleteOrder(orderId) {
  const res = await fetch(buildUrl(`/orders/${orderId}`), { method: 'DELETE' });
  return res.json();
}
export async function getOrder(orderId) {
  const res = await fetch(buildUrl(`/orders/${orderId}`));
  return res.json();
}
export async function getGuide(guideId) {
  const res = await fetch(buildUrl(`/guides/${guideId}`));
  return res.json();
}

export function calcPrice({ guideServiceCost, hoursNumber, date, time, persons, optionFirst, optionSecond }) {
  const day = new Date(date).getDay();
  const isWeekend = day === 0 || day === 6;
  const dayOffMult = isWeekend ? 1.5 : 1.0;

  const [hhStr] = String(time).split(':');
  const hh = Number(hhStr);
  const morning = hh >= 9 && hh < 12 ? 400 : 0;
  const evening = hh >= 20 && hh <= 23 ? 1000 : 0;

  let visitors = 0;
  if (persons > 5 && persons <= 10) visitors = 1000;
  else if (persons > 10 && persons <= 20) visitors = 1500;

  let base = guideServiceCost * hoursNumber * dayOffMult + morning + evening + visitors;
  if (optionSecond) base *= 0.75;
  else if (optionFirst) base *= 0.85;

  return Math.round(base);
}

export function paginate(list, page, perPage) {
  const start = (page - 1) * perPage;
  return list.slice(start, start + perPage);
} 