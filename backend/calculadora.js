// Lógica de cálculo (sin eval): analizador por descenso recursivo.
// Soporta: + - * / % ^ paréntesis, decimales, negativos, sqrt(x)
function evaluar(expr) {
  const s = String(expr).replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
  if (!s) throw new Error('Expresión vacía');
  if (s.length > 200) throw new Error('Expresión demasiado larga');
  let i = 0;
  const peek = () => s[i];

  function expresion() {            // suma y resta
    let v = termino();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++]; const r = termino();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function termino() {             // * / %
    let v = potencia();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = s[i++]; const r = potencia();
      if (op === '*') v *= r;
      else if (op === '/') { if (r === 0) throw new Error('División por cero'); v /= r; }
      else { if (r === 0) throw new Error('Módulo por cero'); v %= r; }
    }
    return v;
  }
  function potencia() {            // ^ (asociativa a la derecha)
    const base = unario();
    if (peek() === '^') { i++; return Math.pow(base, potencia()); }
    return base;
  }
  function unario() {
    if (peek() === '-') { i++; return -unario(); }
    if (peek() === '+') { i++; return unario(); }
    return primario();
  }
  function primario() {
    if (s.startsWith('sqrt(', i)) {
      i += 5; const v = expresion();
      if (peek() !== ')') throw new Error('Falta cerrar paréntesis');
      i++;
      if (v < 0) throw new Error('Raíz de número negativo');
      return Math.sqrt(v);
    }
    if (peek() === '(') {
      i++; const v = expresion();
      if (peek() !== ')') throw new Error('Falta cerrar paréntesis');
      i++; return v;
    }
    const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(s.slice(i)) || /^\d+\.?/.exec(s.slice(i));
    if (!m) throw new Error('Expresión inválida');
    i += m[0].length;
    return parseFloat(m[0]);
  }

  const resultado = expresion();
  if (i < s.length) throw new Error('Expresión inválida');
  if (!Number.isFinite(resultado)) throw new Error('Resultado fuera de rango');
  return Math.round(resultado * 1e10) / 1e10; // evita 0.1+0.2=0.30000000000000004
}
module.exports = { evaluar };
