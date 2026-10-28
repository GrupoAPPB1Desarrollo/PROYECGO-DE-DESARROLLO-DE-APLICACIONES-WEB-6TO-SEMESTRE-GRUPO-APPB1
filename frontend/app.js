const $expr = document.getElementById('expresion');
const $res = document.getElementById('resultado');
const $lista = document.getElementById('lista');
let expresion = '';
let acabaDeCalcular = false;
let errorActivo = false;

const ES_OPERADOR = /[+\-*/%^]$/;
const mostrar = (txt, error = false) => { $res.textContent = txt; $res.classList.toggle('error', error); };
const bonito = s => s.replace(/\*/g, '×').replace(/\//g, '÷');

function actualizar() {
  $expr.textContent = bonito(expresion);
  if (!errorActivo) mostrar(expresion || '0');
}

function agregar(valor) {
  errorActivo = false;
  const esNumero = /^[\d.]$/.test(valor);
  if (acabaDeCalcular) {                      // tras "=", un número empieza de nuevo; un operador continúa
    if (esNumero || valor === '(' || valor === 'sqrt(') expresion = '';
    acabaDeCalcular = false;
  }
  if (ES_OPERADOR.test(valor) && ES_OPERADOR.test(expresion) && valor !== '-') {
    expresion = expresion.slice(0, -1);       // reemplaza operador repetido
  }
  if (ES_OPERADOR.test(valor) && expresion === '' && valor !== '-') return;
  expresion += valor;
  actualizar();
}

function borrar() {
  errorActivo = false;
  expresion = expresion.endsWith('sqrt(') ? expresion.slice(0, -5) : expresion.slice(0, -1);
  actualizar();
}
function limpiar() { expresion = ''; errorActivo = false; $expr.textContent = ''; mostrar('0'); }

function cambiarSigno() {
  if (!expresion) return;
  expresion = expresion.startsWith('-(') && expresion.endsWith(')') ? expresion.slice(2, -1) : `-(${expresion})`;
  actualizar();
}

async function calcular() {
  if (!expresion) return;
  // cierra paréntesis pendientes automáticamente
  const faltan = (expresion.match(/\(/g) || []).length - (expresion.match(/\)/g) || []).length;
  if (faltan > 0) expresion += ')'.repeat(faltan);
  try {
    const r = await fetch('/api/calcular', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expresion })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    $expr.textContent = bonito(expresion) + ' =';
    expresion = String(data.resultado);
    acabaDeCalcular = true; errorActivo = false;
    mostrar(expresion);
    cargarHistorial();
  } catch (e) {
    errorActivo = true;
    mostrar(e.message === 'Failed to fetch' ? 'Sin conexión con el servidor' : e.message, true);
  }
}

async function cargarHistorial() {
  try {
    const items = await (await fetch('/api/historial')).json();
    $lista.innerHTML = items.length ? '' : '<li class="vacio">Sin operaciones</li>';
    items.forEach(it => {
      const li = document.createElement('li');
      li.innerHTML = '<small></small><strong></strong>';
      li.querySelector('small').textContent = bonito(it.expresion);
      li.querySelector('strong').textContent = it.resultado;
      li.onclick = () => { expresion = String(it.resultado); acabaDeCalcular = true; $expr.textContent = ''; actualizar(); };
      $lista.appendChild(li);
    });
  } catch { /* servidor no disponible */ }
}

document.querySelector('.teclado').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.valor) return agregar(b.dataset.valor);
  ({ limpiar, borrar, igual: calcular, signo: cambiarSigno })[b.dataset.accion]();
});
document.getElementById('borrarHistorial').onclick = async () => { await fetch('/api/historial', { method: 'DELETE' }); cargarHistorial(); };

// Teclado físico
document.addEventListener('keydown', e => {
  if (/^[\d.()+\-*/%^]$/.test(e.key)) agregar(e.key);
  else if (e.key === ',') agregar('.');
  else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calcular(); }
  else if (e.key === 'Backspace') borrar();
  else if (e.key === 'Escape') limpiar();
});
cargarHistorial();
