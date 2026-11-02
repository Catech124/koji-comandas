# Kōji — comandas (Google Apps Script)

Sistema de comandas para una izakaya, construido como **web app de Google Apps Script**:
la interfaz habla con el backend por `google.script.run` y el estado vive en
`PropertiesService` del proyecto (no hay servidor propio ni base de datos externa).

## Enlaces

| | URL | Qué es |
|---|---|---|
| **Web app (Apps Script, backend real)** | https://script.google.com/macros/s/AKfycbzq3UqHfsyci9AHcFQy-SGHEPLpMMOaMPu72FxJID5GEdeJaRZjPzBixeJPVjrOJkZAZw/exec | El sistema completo. Si el navegador tiene varias cuentas de Google, Google puede devolver "Página no encontrada": abrir en **ventana privada**. |
| **Respaldo público (GitHub Pages)** | https://catech124.github.io/koji-comandas/ | La misma interfaz con un adaptador que emula el backend en el navegador. Abre en cualquier cuenta, sin incógnito. |

> El 404 no es de la app: pasa con cualquier web app de Apps Script de otra cuenta
> cuando el navegador tiene varias sesiones de Google abiertas (probado también con
> un web app vacío).

---

## Por qué esta versión es distinta a la de Tonalli

| | Tonalli | Kōji |
|---|---|---|
| Dónde vive | Archivo estático en GitHub Pages | Web app de Apps Script |
| Datos | `localStorage` | `PropertiesService` del proyecto |
| Menú | Cocina mexicana contemporánea, 28 platillos | Izakaya y ramen, 30 platillos |
| Estructura | Tres columnas simultáneas | Salón + carta en filas + **barra de pedido deslizante** |
| Cocina | Rejilla de comandas | **Kanban**: nuevas → en fuego → listas |
| Ticket | Papel térmico centrado | Recibo con banda negra, mods con barra lateral y sello circular |
| Lenguaje | Verde/oro, serif editorial | Blanco/negro/bermellón, sans condensada, sombras duras |

## Cómo se opera

1. **Salón**: elegir mesa 01–20. Punto rojo = comanda en curso; borde rojo = ya mandó orden.
2. **Carta**: cinco categorías; cada platillo trae descripción, tiempo y precio. Un clic
   en la fila agrega la partida.
3. **Barra de pedido**: mesa, comensales, partidas, salida estimada y total.
   *Abrir pedido* despliega el detalle con comensales, mesero y salida por estación.
4. Tocar una partida abre el editor: término, modificaciones estándar, alergia,
   comensal y nota libre.
5. **Mandar a cocina** genera el folio (`K-001`), sella la hora y muestra el ticket
   para imprimir a 80 mm.
6. **Cocina**: *Tomar* pasa la comanda a **En fuego**; *Marcar listo* la cierra y
   **detiene el cronómetro** con el tiempo real de preparación.

## Tiempos

El tiempo de la comanda se calcula por pases:

- **1er tiempo**: para picar
- **2º tiempo**: sushi y robata en paralelo (se toma el máximo)
- **3er tiempo**: ramen
- **Postre**
- **Barra** no suma: sale de inmediato

## Archivos

```
Code.gs             backend: carta, folios, estados, almacén clave-valor
Index.html          interfaz completa (HTML + CSS + JS)
appsscript.json     manifest del web app
build-static.py     genera docs/ (copia estática con adaptador de google.script.run)
docs/index.html     copia publicada en GitHub Pages
```

### Almacén

Una propiedad por comanda (`c:K-001`) y un índice `indice` con los folios. Sin hojas de
cálculo ni scopes de Google: el web app es público y no pide autorización. Se conservan
las últimas 120 comandas.

Funciones desde el editor de Apps Script: `reiniciarTurno()`, `arranque()`,
`mandar({mesa, comensales, mesero, items})`. En la interfaz hay un botón **Nuevo turno**
en la pestaña Carta.

## Editar la carta

Los platillos están en la constante `CARTA` de `Code.gs`:

```js
{ id, n (nombre), c (categoría), p (precio), m (minutos),
  d (descripción), op (modificaciones), term (término), veg }
```

Categorías: `picar`, `sushi`, `robata`, `ramen`, `postre`, `barra`.
Después de editar: **Implementar → Administrar implementaciones → Editar → Nueva versión**.
Para la copia estática: `python3 build-static.py` y hacer commit de `docs/`.

## Guion de demostración (3 tiempos)

1. Mesa **07**, 3 comensales.
2. **Para picar** → *Gyozas de cerdo · 5 pzas*, con **Bien doradas**.
3. **Sushi** → *Rollo Kōji*.
4. **Robata** → *Costilla de res yakiniku*, con **3/4** y alergia **Soya**.
5. **Mandar a cocina** → ticket K-00x con folio, hora, pases, modificaciones y sello.
6. **Ver en cocina** → *Tomar* → *Marcar listo*: el cronómetro se detiene.

## Detalle técnico

- La interfaz corre dentro del iframe de Google (`userCodeAppPanel`); por eso el CSS y
  el JS van en `Index.html`.
- Impresión: `@page` de 80 mm × 250 mm; solo se imprime el ticket.
- Sin dependencias salvo la tipografía Archivo (Google Fonts) con caída a la sans del sistema.
