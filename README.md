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

## Modelo de bono (proporcional por persona)

La calculadora vigente queda anclada a estas dos referencias reales:

- **3 personas · 140 mallas = $5.306 líquidos por persona**
- **3 personas · 150 mallas = $6.732 líquidos por persona**
- Por proporcionalidad, **5 personas · 250 mallas = $6.732 líquidos por persona** porque ambos casos son 50 mallas por persona.

Parámetros:

- Costo bruto por persona/turno: **$37.000**
- Objetivo de ahorro: **$72/kg**
- Factor líquido: **72%**
- Malla equivalente: **15 kg**
- Factor de escala por tamaño de equipo: **100% para 3 a 9 personas**
- Reparto del ahorro: **N1 55% · N2 50% · N3 40% · N4 30%**
- Regla **“el pozo nunca baja”**: al cruzar a un nivel con menor porcentaje se conserva el pozo ya alcanzado hasta que la nueva fórmula lo supere.

Fórmula:

```
kg = mallas_equivalentes * 15
costo_turno = personas * 37000
ahorro = max(0, kg * 72 - costo_turno)
pozo_equipo = ahorro * porcentaje_del_nivel
liquido_persona = (pozo_equipo / personas) * 0.72
```

El bono se escala por producción por persona: a igual cantidad de mallas por persona, corresponde el mismo líquido por persona, independiente del tamaño del equipo.

### Metas proporcionales

| Personas | Base mallas eq. | N1 bono | N2 | N3 | N4 |
|---:|---:|---:|---:|---:|---:|
| 3 | 100,0 | 110,0 | 151,0 | 174,0 | 208,0 |
| 4 | 133,3 | 146,7 | 201,3 | 232,0 | 277,3 |
| 5 | 166,7 | 183,3 | 251,7 | 290,0 | 346,7 |
| 6 | 200,0 | 220,0 | 302,0 | 348,0 | 416,0 |
| 7 | 233,3 | 256,7 | 352,3 | 406,0 | 485,3 |
| 8 | 266,7 | 293,3 | 402,7 | 464,0 | 554,7 |
| 9 | 300,0 | 330,0 | 453,0 | 522,0 | 624,0 |

La app calcula con **kg reales**; las mallas son una equivalencia visual de 15 kg.

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

<!-- deploy refresh -->
