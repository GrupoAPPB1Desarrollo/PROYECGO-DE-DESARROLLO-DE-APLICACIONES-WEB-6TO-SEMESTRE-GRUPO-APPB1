const express = require('express');
const path = require('path');
const { evaluar } = require('./calculadora');

const app = express();
const PORT = process.env.PORT || 3000;
const historial = []; // en memoria (últimas 20 operaciones)

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// POST /api/calcular  { "expresion": "2+3*4" }  ->  { "resultado": 14 }
app.post('/api/calcular', (req, res) => {
  try {
    const { expresion } = req.body || {};
    if (typeof expresion !== 'string') throw new Error('Se requiere el campo "expresion"');
    const resultado = evaluar(expresion);
    historial.unshift({ expresion, resultado, fecha: new Date().toISOString() });
    if (historial.length > 20) historial.pop();
    res.json({ resultado });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/historial', (_req, res) => res.json(historial));
app.delete('/api/historial', (_req, res) => { historial.length = 0; res.status(204).end(); });

app.listen(PORT, () => console.log(`Calculadora en http://localhost:${PORT}`));
