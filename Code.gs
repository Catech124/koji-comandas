/**
 * KŌJI — izakaya & ramen
 * Backend de comandas en Google Apps Script.
 *
 * Almacén: PropertiesService del proyecto (clave-valor persistente, sin hojas ni
 * scopes de Google), una propiedad por comanda y un índice de folios.
 * Así la web app es pública y no pide autorización a quien la abre.
 */

const MESEROS = ['Yuki Tanaka', 'Marco Delgado', 'Sofía Ibarra', 'Ren Aoki'];
const LIMITE_COMANDAS = 120;   // se conservan las últimas N

/** Carta. Editar aquí y volver a desplegar. */
const CARTA = [
  { id: 'p1', n: 'Edamame al yuzu', c: 'picar', p: 45, m: 4, d: 'Vainas de soya, sal de yuzu y aceite de ajonjolí.', op: ['Sin sal', 'Sin yuzu', 'Extra limón'], veg: true },
  { id: 'p2', n: 'Gyozas de cerdo · 5 pzas', c: 'picar', p: 95, m: 8, d: 'Cerdo, col y jengibre; salsa ponzu.', op: ['Sin ponzu', 'Bien doradas', 'Al vapor'] },
  { id: 'p3', n: 'Karaage de pollo', c: 'picar', p: 110, m: 10, d: 'Muslo marinado en jengibre, kewpie y shichimi.', op: ['Sin kewpie', 'Sin shichimi', 'Extra limón'] },
  { id: 'p4', n: 'Takoyaki · 6 pzas', c: 'picar', p: 105, m: 9, d: 'Pulpo, katsuobushi y mayo japonesa.', op: ['Sin katsuobushi', 'Sin mayo'] },
  { id: 'p5', n: 'Tofu agedashi', c: 'picar', p: 85, m: 7, d: 'Tofu frito, dashi y cebollín.', op: ['Sin dashi', 'Sin cebollín'], veg: true },
  { id: 'p6', n: 'Sunomono de pepino', c: 'picar', p: 65, m: 4, d: 'Pepino, wakame y vinagre de arroz.', op: ['Sin wakame', 'Extra ajonjolí'], veg: true },

  { id: 's1', n: 'Nigiri de atún · 2 pzas', c: 'sushi', p: 95, m: 5, d: 'Atún rojo y wasabi fresco.', op: ['Sin wasabi', 'Extra wasabi', 'Soya aparte'] },
  { id: 's2', n: 'Nigiri de salmón · 2 pzas', c: 'sushi', p: 85, m: 5, d: 'Salmón noruego y cebollín.', op: ['Sin wasabi', 'Sin cebollín'] },
  { id: 's3', n: 'Sashimi moriawase · 9 pzas', c: 'sushi', p: 320, m: 9, d: 'Selección del día: atún, salmón y hamachi.', op: ['Sin wasabi', 'Soya aparte'] },
  { id: 's4', n: 'Rollo Kōji', c: 'sushi', p: 165, m: 11, d: 'Camarón tempura, aguacate, tobiko y salsa de anguila.', op: ['Sin anguila', 'Sin tobiko', 'Sin aguacate'] },
  { id: 's5', n: 'Temaki de salmón', c: 'sushi', p: 90, m: 6, d: 'Cono de alga, arroz, salmón y aguacate.', op: ['Sin aguacate', 'Sin alga'] },
  { id: 's6', n: 'Onigiri de salmón', c: 'sushi', p: 55, m: 4, d: 'Triángulo de arroz, salmón y ajonjolí.', op: ['Sin alga', 'Sin ajonjolí'] },

  { id: 'r1', n: 'Yakitori de pollo · 3 pzas', c: 'robata', p: 120, m: 12, d: 'Muslo a la brasa con tare de la casa.', op: ['Sin tare', 'Extra limón', 'Bien cocido'] },
  { id: 'r2', n: 'Pescado del día a la brasa', c: 'robata', p: 285, m: 20, d: 'Carbón de encino, sal de mar y daikon.', op: ['Salsa aparte', 'Sin sal'], term: true },
  { id: 'r3', n: 'Costilla de res yakiniku', c: 'robata', p: 320, m: 22, d: 'Marinada de soya y mirin, cebollín.', op: ['Sin soya', 'Extra cebollín', 'Salsa aparte'], term: true },
  { id: 'r4', n: 'Puerro y hongos a la brasa', c: 'robata', p: 95, m: 10, d: 'Puerro, shiitake y limón asado.', op: ['Sin limón', 'Extra shiitake'], veg: true },
  { id: 'r5', n: 'Camarón a la brasa', c: 'robata', p: 210, m: 14, d: 'Mantequilla de yuzu y sal de mar.', op: ['Sin mantequilla', 'Sin sal'] },

  { id: 'n1', n: 'Ramen tonkotsu', c: 'ramen', p: 185, m: 14, d: 'Caldo de cerdo 12 h, chashu y huevo marinado.', op: ['Sin huevo', 'Sin cebollín', 'Extra picante', 'Caldo aparte'] },
  { id: 'n2', n: 'Ramen shoyu de pollo', c: 'ramen', p: 175, m: 12, d: 'Caldo claro, soya, bamboo y nori.', op: ['Sin nori', 'Sin cebollín', 'Caldo aparte'] },
  { id: 'n3', n: 'Arroz con huevo y furikake', c: 'ramen', p: 85, m: 8, d: 'Arroz al vapor, huevo y ajonjolí.', op: ['Sin huevo', 'Sin furikake'], veg: true },
  { id: 'n4', n: 'Donburi de salmón', c: 'ramen', p: 195, m: 10, d: 'Arroz, salmón, aguacate y salsa ponzu.', op: ['Sin aguacate', 'Sin ponzu'] },

  { id: 'd1', n: 'Mochi de matcha · 2 pzas', c: 'postre', p: 70, m: 4, d: 'Mochi relleno de helado de matcha.', op: ['Sin matcha'] },
  { id: 'd2', n: 'Crème brûlée de yuzu', c: 'postre', p: 85, m: 5, d: 'Crema de yuzu con azúcar quemada.', op: ['Sin azúcar extra'] },
  { id: 'd3', n: 'Helado de sésamo negro', c: 'postre', p: 65, m: 3, d: 'Sésamo tostado, una bola.', op: ['En copa'] },

  { id: 'b1', n: 'Sake junmai · 2 oz', c: 'barra', p: 95, m: 2, d: 'Servido frío o a temperatura ambiente.', op: ['Frío', 'Templado'] },
  { id: 'b2', n: 'Cerveza Asahi', c: 'barra', p: 70, m: 2, d: 'Botella 330 ml.', op: ['Bien fría'] },
  { id: 'b3', n: 'Highball de whisky japonés', c: 'barra', p: 120, m: 3, d: 'Whisky, soda y piel de limón.', op: ['Doble', 'Sin limón'] },
  { id: 'b4', n: 'Té verde caliente', c: 'barra', p: 40, m: 3, d: 'Sencha de la casa.', op: ['Sin azúcar'] },
  { id: 'b5', n: 'Limonada de yuzu', c: 'barra', p: 55, m: 3, d: 'Yuzu, limón y agua mineral.', op: ['Sin azúcar', 'Sin hielo'] },
  { id: 'b6', n: 'Agua mineral', c: 'barra', p: 35, m: 1, d: 'Botella 600 ml.', op: ['Sin gas'] }
];

/* ------------------------------------------------------------------ */
/*  Almacén clave-valor                                                */
/* ------------------------------------------------------------------ */

function props_() { return PropertiesService.getScriptProperties(); }

function indice_() {
  const raw = props_().getProperty('indice');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function guardarIndice_(lista) {
  props_().setProperty('indice', JSON.stringify(lista));
}

function leerComanda_(folio) {
  const raw = props_().getProperty('c:' + folio);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function guardarComanda_(c) {
  props_().setProperty('c:' + c.folio, JSON.stringify(c));
}

function folioDe_(lista) {
  return lista.reduce(function (max, f) {
    const n = parseInt(String(f).replace(/\D/g, ''), 10) || 0;
    return n > max ? n : max;
  }, 0);
}

/* ------------------------------------------------------------------ */
/*  API para la interfaz                                               */
/* ------------------------------------------------------------------ */

function arranque() {
  const lista = indice_();
  const abiertas = [];
  lista.forEach(function (folio) {
    const c = leerComanda_(folio);
    if (c && c.estado !== 'cobrado') abiertas.push(c);
  });
  return {
    carta: CARTA,
    meseros: MESEROS,
    comandas: abiertas,
    folio: folioDe_(lista),
    ahora: Date.now()
  };
}

function mandar(orden) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const lista = indice_();
    const n = folioDe_(lista) + 1;
    const folio = 'K-' + ('00' + n).slice(-3);
    const items = (orden.items || []).map(function (i) {
      return {
        id: i.id, nombre: i.nombre, categoria: i.categoria, precio: Number(i.precio),
        minutos: Number(i.minutos), qty: Number(i.qty), termino: i.termino || null,
        op: i.op || [], nota: i.nota || '', alergia: i.alergia || '',
        comensal: i.comensal || null, urgente: !!i.urgente
      };
    });
    const total = items.reduce(function (a, i) { return a + i.precio * i.qty; }, 0);
    const comanda = {
      folio: folio,
      ts: Date.now(),
      mesa: Number(orden.mesa),
      comensales: Number(orden.comensales),
      mesero: String(orden.mesero || MESEROS[0]),
      items: items,
      estado: 'nueva',
      tsListo: null,
      total: total
    };
    guardarComanda_(comanda);

    lista.push(folio);
    // recorte: se conservan las últimas N comandas
    while (lista.length > LIMITE_COMANDAS) {
      const viejo = lista.shift();
      props_().deleteProperty('c:' + viejo);
    }
    guardarIndice_(lista);

    return { folio: comanda.folio, ts: comanda.ts, total: total, estado: 'nueva' };
  } finally {
    lock.releaseLock();
  }
}

function cambiarEstado(folio, estado) {
  const c = leerComanda_(folio);
  if (!c) return { ok: false, error: 'folio no encontrado' };
  c.estado = estado;
  if (estado === 'listo') c.tsListo = Date.now();
  guardarComanda_(c);
  return { ok: true, folio: folio, estado: estado, tsListo: c.tsListo };
}

function cerrarMesa(mesa) {
  const lista = indice_();
  let n = 0;
  lista.forEach(function (folio) {
    const c = leerComanda_(folio);
    if (c && Number(c.mesa) === Number(mesa) && c.estado !== 'cobrado') {
      c.estado = 'cobrado';
      guardarComanda_(c);
      n++;
    }
  });
  return { ok: true, cerradas: n };
}

function comandasAbiertas() {
  return arranque().comandas;
}

/** Borra todas las comandas (turno nuevo). Ejecutar desde el editor. */
function reiniciarTurno() {
  const lista = indice_();
  lista.forEach(function (f) { props_().deleteProperty('c:' + f); });
  props_().deleteProperty('indice');
  return { ok: true, borradas: lista.length };
}

/* ------------------------------------------------------------------ */
/*  Web app                                                            */
/* ------------------------------------------------------------------ */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Kōji · comandas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
