#!/usr/bin/env python3
"""Genera docs/index.html (copia estática de la web app) a partir de Index.html + CARTA de Code.gs.

La copia estática emula google.script.run con localStorage, con la MISMA API que el
backend de Apps Script, para que el link abra en cualquier navegador y cuenta.
"""
import json
import re
from pathlib import Path

ROOT = Path("/home/ada/Projects/koji-comandas")
index = (ROOT / "Index.html").read_text(encoding="utf-8")
code = (ROOT / "Code.gs").read_text(encoding="utf-8")

m = re.search(r"const CARTA = \[(.*?)\n\];", code, re.S)
carta_js = "[" + m.group(1) + "\n]"
meseros = re.search(r"const MESEROS = \[(.*?)\];", code, re.S).group(1)

shim = """<script>
/* Adaptador estático: emula google.script.run con localStorage.
   Misma API que el backend de Apps Script (arranque, mandar, cambiarEstado,
   cerrarMesa, comandasAbiertas, reiniciarTurno). */
(function(){
  var CLAVE = 'koji.web.v1';
  var CARTA = __CARTA__;
  var MESEROS = [__MESEROS__];

  function leer(){
    try { return JSON.parse(localStorage.getItem(CLAVE)) || { folio: 0, indice: [], cmd: {} }; }
    catch (e) { return { folio: 0, indice: [], cmd: {} }; }
  }
  function guardar(d){ try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }

  var api = {
    arranque: function(){
      var d = leer();
      var abiertas = d.indice.map(function(f){ return d.cmd[f]; }).filter(function(c){ return c && c.estado !== 'cobrado'; });
      return { carta: CARTA, meseros: MESEROS, comandas: abiertas, folio: d.folio, ahora: Date.now() };
    },
    mandar: function(orden){
      var d = leer();
      d.folio = (d.folio || 0) + 1;
      var folio = 'K-' + ('00' + d.folio).slice(-3);
      var items = (orden.items || []).map(function(i){
        return { id: i.id, nombre: i.nombre, categoria: i.categoria, precio: +i.precio,
                 minutos: +i.minutos, qty: +i.qty, termino: i.termino || null, op: i.op || [],
                 nota: i.nota || '', alergia: i.alergia || '', comensal: i.comensal || null,
                 urgente: !!i.urgente };
      });
      var total = items.reduce(function(a, i){ return a + i.precio * i.qty; }, 0);
      var c = { folio: folio, ts: Date.now(), mesa: +orden.mesa, comensales: +orden.comensales,
                mesero: orden.mesero || MESEROS[0], items: items, estado: 'nueva', tsListo: null, total: total };
      d.cmd[folio] = c;
      d.indice.push(folio);
      while (d.indice.length > 120) { delete d.cmd[d.indice.shift()]; }
      guardar(d);
      return { folio: folio, ts: c.ts, total: total, estado: 'nueva' };
    },
    cambiarEstado: function(folio, estado){
      var d = leer();
      var c = d.cmd[folio];
      if (!c) return { ok: false, error: 'folio no encontrado' };
      c.estado = estado;
      if (estado === 'listo') c.tsListo = Date.now();
      guardar(d);
      return { ok: true, folio: folio, estado: estado, tsListo: c.tsListo };
    },
    cerrarMesa: function(mesa){
      var d = leer(); var n = 0;
      d.indice.forEach(function(f){
        var c = d.cmd[f];
        if (c && c.mesa === +mesa && c.estado !== 'cobrado') { c.estado = 'cobrado'; n++; }
      });
      guardar(d);
      return { ok: true, cerradas: n };
    },
    comandasAbiertas: function(){
      var d = leer();
      return d.indice.map(function(f){ return d.cmd[f]; }).filter(function(c){ return c && c.estado !== 'cobrado'; });
    },
    reiniciarTurno: function(){
      var d = leer();
      guardar({ folio: 0, indice: [], cmd: {} });
      return { ok: true, borradas: d.indice.length };
    }
  };

  function corredor(){
    var ok = null, ko = null;
    var r = {
      withSuccessHandler: function(f){ ok = f; return r; },
      withFailureHandler: function(f){ ko = f; return r; }
    };
    Object.keys(api).forEach(function(k){
      r[k] = function(){
        var args = arguments;
        setTimeout(function(){
          try { var v = api[k].apply(null, args); if (ok) ok(v); }
          catch (e) { if (ko) ko(e); }
        }, 40);
      };
    });
    return r;
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  Object.defineProperty(window.google.script, 'run', { get: corredor, configurable: true });
})();
</script>
"""

shim = shim.replace("__CARTA__", carta_js).replace("__MESEROS__", meseros)

marca = '<script>\n"use strict";'
assert marca in index, "no se encontró el script principal"
out = index.replace(marca, shim + marca, 1)

docs = ROOT / "docs"
docs.mkdir(exist_ok=True)
(docs / "index.html").write_text(out, encoding="utf-8")
print("docs/index.html", len(out), "bytes")
