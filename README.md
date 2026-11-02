# Kōji — comandas (Google Apps Script)

Sistema de comandas para una izakaya, hecho como **web app de Google Apps Script**:
el navegador no habla con ningún servidor propio, todo pasa por `google.script.run`.

**App:**  
https://script.google.com/macros/s/AKfycbzq3UqHfsyci9AHcFQy-SGHEPLpMMOaMPu72FxJID5GEdeJaRZjPzBixeJPVjrOJkZAZw/exec

> Se abre sin cuenta de Google y sin autorizar permisos: el script no pide scopes.

---

## Por qué esta versión es distinta a la de Tonalli

| | Tonalli (primera entrega) | Kōji (esta entrega) |
|---|---|---|
| Dónde vive | GitHub Pages, archivo estático | Web app de Apps Script |
| Datos | `localStorage` del navegador | `PropertiesService` del proyecto (estado compartido entre pestañas y equipos) |
| Menú | Cocina mexicana contemporánea, 28 platillos | Izakaya y ramen, 30 platillos |
| Estructura | Tres columnas simultáneas (mesas · carta · papel) | Salón + carta en filas + **barra de pedido deslizante** |
| Comanda | Papel de comanda sobre la mesa | Barra inferior que se expande con la orden |
| Cocina | Rejilla de comandas | **Kanban**: nuevas → en fuego → listas |
| Ticket | Papel térmico centrado | Recibo con banda negra, mods con barra lateral y sello circular |
| Lenguaje visual | Verde/oro, serif editorial | Blanco/negro/rojo bermellón, sans condensada, sombras duras |

## Cómo se opera

1. **Salón** (columna izquierda): elegir mesa 01–20. Las mesas con comanda en curso
   muestran un punto rojo; las que ya mandaron orden se marcan en rojo con el número
   de comandas.
2. **Carta** (centro): cinco categorías, cada platillo con descripción, tiempo y precio.
   Un clic en la fila agrega la partida; el `+` es el mismo botón.
3. **Barra de pedido** (abajo): muestra mesa, comensales, partidas, salida estimada y total.
   **Abrir pedido** despliega el detalle, donde se ajustan comensales, mesero y se ve
   la salida por estación.
4. Tocar una partida abre el editor: término (en brasa), modificaciones estándar,
   alergia declarada, comensal y nota libre.
5. **Mandar a cocina** genera el folio (`K-001`), sella la hora y muestra el ticket
   listo para imprimir a 80 mm.
6. **Cocina**: las comandas entran en *Nuevas*; **Tomar** las pasa a *En fuego* y
   **Marcar listo** las cierra. El cronómetro corre hasta que se marcan listas: ahí
   se congela con el tiempo real de preparación.

## Tiempos

Cada platillo tiene minutos de preparación y una estación. El tiempo de la comanda se
calcula por pases:

- **1er tiempo**: para picar
- **2º tiempo**: sushi y robata corren en paralelo (se toma el máximo)
- **3er tiempo**: ramen
- **Postre**
- **Barra** no suma: sale de inmediato

## Estructura del proyecto

```
Code.gs          backend: carta, folios, estados, almacén clave-valor
Index.html       interfaz completa (HTML + CSS + JS en un archivo)
appsscript.json  manifest del web app (executeAs USER_DEPLOYING / ANYONE_ANONYMOUS)
```

### Almacén

`PropertiesService` del proyecto guarda una propiedad por comanda (`c:K-001`) y un
índice `indice` con los folios. No usa hojas de cálculo ni scopes de Google, por eso
el web app es público y no pide autorización a quien lo abre. Se conservan las últimas
120 comandas.

Funciones útiles desde el editor de Apps Script:

- `reiniciarTurno()` — borra todas las comandas (también hay botón **Nuevo turno** en la pestaña Carta).
- `arranque()` — devuelve la carta y las comandas abiertas (lo que consume la interfaz).
- `mandar({mesa, comensales, mesero, items})` — crea la comanda y devuelve el folio.

## Editar la carta

Los platillos están en la constante `CARTA` de `Code.gs`:

```js
{ id, n (nombre), c (categoría), p (precio), m (minutos),
  d (descripción), op (modificaciones), term (término), veg }
```

Categorías válidas: `picar`, `sushi`, `robata`, `ramen`, `postre`, `barra`.
Después de editar: **Implementar → Administrar implementaciones → Editar → Nueva versión**.

## Guion de demostración (3 tiempos)

1. Mesa **07**, 3 comensales.
2. **Para picar** → *Gyozas de cerdo · 5 pzas*.
3. Abrir la partida y marcar **Bien doradas** + nota `Sin ponzu aparte`.
4. **Sushi** → *Rollo Kōji*.
5. **Robata** → *Costilla de res yakiniku*, con **3/4** y alergia **Soya**.
6. **Mandar a cocina** → ticket K-00x con folio, hora, pases, modificaciones y sello.
7. **Ver en cocina** → **Tomar** → **Marcar listo**: el cronómetro se detiene.

## Detalle técnico

- El web app se sirve dentro de un iframe de Google (`userCodeAppPanel`), así que los
  estilos y el JS viven en `Index.html` y no en archivos sueltos.
- Impresión: `@page` de 80 mm × 250 mm; se imprime solo el ticket.
- Sin dependencias externas salvo la tipografía Archivo (Google Fonts); si no carga,
  cae a la sans del sistema.
