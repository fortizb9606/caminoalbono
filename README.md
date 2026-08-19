# Camino al Bono — THE ICE

App de turno para operarios (iPad / móvil), estilo gym: contador de mallas en vivo, camino visual al bono y reportería mensual.

**Producción:** https://camino-al-bono-theice.netlify.app
(la calculadora de administración vive aparte en https://calculadora-bono-theice.netlify.app)

## Estructura del repo

```
index.html                     ← toda la app (una sola página, sin build)
netlify/functions/turnos.mjs   ← API /api/turnos (Netlify Blobs)
netlify.toml                   ← config de publicación
package.json                   ← dependencia @netlify/blobs (solo para la function)
```

## Modelo de bono (setting final)

- Costo bruto empresa: **$37.000** por persona/turno · malla 15 kg · objetivo **$70/kg** MO · líquido ≈ 76% del bruto.
- Metas de referencia a 6 personas: Base 190 · N1 220 · N2 260 · N3 300 · N4 360. **Escalan por dotación** (× personas ÷ 6); el bono parte cuando la MO real baja de $70/kg (malla 212 con 6 personas).
- Perillas de reparto del ahorro: **N1 100% · N2 80% · N3 70% · N4 60%** equipo.
- **Regla "el pozo nunca baja"**: al cruzar de nivel se conserva lo ya logrado en la malla anterior al umbral, hasta que el cálculo nuevo lo supere (misma regla en la calculadora).
- Turnos por reloj: día 07:00–16:00 · noche 22:00–07:00 · **8 h efectivas** (colación 12–13 / 02–03 descontada). Ritmo y proyección se calculan contra el reloj del turno, no contra el uso de la app.
- Cifras referenciales: el cierre oficial lo valida administración con el inventario.

## API de reportería (`/api/turnos`)

Guardada en Netlify Blobs (store `turnos`, key `history`). Consistencia eventual (~segundos).

- `GET /api/turnos` → lista completa de turnos guardados (JSON).
- `POST /api/turnos` → agrega un turno `{ts, month, people, bags, kg, m, level, pozo, ppLiq, below, crew}` (dedup por `ts`).
- `DELETE /api/turnos?ts=<timestamp>` → borra un turno (corrección de administración).

La app además cachea en `localStorage` del dispositivo y sincroniza al abrir la reportería. La API es pública: si se masifica, agregar una clave simple.

## Cómo crear el proyecto en GitHub

1. En GitHub: **New repository** → nombre `camino-al-bono-theice` → privado → crear.
2. Subir estos archivos (arrastrándolos en "uploading an existing file" o por terminal):
   ```bash
   git init && git add . && git commit -m "Camino al Bono v1"
   git branch -M main
   git remote add origin git@github.com:TU_USUARIO/camino-al-bono-theice.git
   git push -u origin main
   ```

## Conectar Netlify al repo (una sola vez, ~2 min)

1. Entrar a https://app.netlify.com/projects/camino-al-bono-theice
2. **Site configuration → Build & deploy → Continuous deployment → Link repository**.
3. Elegir GitHub → autorizar → seleccionar `camino-al-bono-theice` → branch `main`.
4. Build command: *(vacío)* · Publish directory: `.` → Save.

Desde ahí, **cada push a `main` publica solo**. Los datos de la reportería (Blobs) y lo guardado en los iPads no se tocan con los deploys.

## Notas de operación

- Nombres part-time agregados quedan registrados en el dispositivo (`localStorage.ptNames`).
- Máximo **3 días bajo la base** al mes o el bono mensual queda en revisión (contador en Reportería + aviso en portada).
- Para resetear un turno pegado: cerrar con "Terminar → Guardar" o borrar `turnoState` en localStorage.
