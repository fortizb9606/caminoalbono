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

## Modelo de bono — Octubre 2026

La lógica final del bono es proporcional por producción por persona y se calcula con **kg reales**.

### Parámetros

- 1 malla equivalente = **15 kg**
- Valor del kilo para generar ahorro = **$72/kg**
- Costo de turno = **$37.000 por persona**
- N1 = **55%** del ahorro al pozo
- N2 = **50%**
- N3 = **40%**
- N4 = **30%**
- Del pozo individual se reconoce **72% como bruto**
- Al bruto se le descuenta **24% legal**
- Factor líquido final sobre el pozo individual = **72% × 76% = 54,72%**
- El pozo se reparte en partes iguales entre quienes hicieron el turno
- **El pozo nunca baja** al cruzar de nivel

### Fórmula

```text
kg = kilos reales registrados

costo_turno = personas * 37000
ahorro = max(0, kg * 72 - costo_turno)

pozo_raw = ahorro * porcentaje_nivel

pozo_protegido = max(
  pozo_raw,
  pisos_de_pozo_ya_alcanzados_en_cambios_de_nivel
)

bruto_persona = (pozo_protegido / personas) * 0.72
liquido_persona = bruto_persona * 0.76
```

Importante: el piso de protección se toma **en el umbral exacto** del nivel usando el porcentaje del nivel anterior. Ejemplo: al entrar a N4 se protege el pozo que habría correspondido en ese mismo umbral usando 40%, hasta que la fórmula N4 de 30% lo supere.

### Umbrales

| Personas | N1 | N2 | N3 | N4 |
|---:|---:|---:|---:|---:|
| 3 | 110 | 151 | 174 | 208 |
| 4 | 146,7 | 201,3 | 232 | 277,3 |
| 5 | 183,3 | 251,7 | 290 | 346,7 |
| 6 | 220 | 302 | 348 | 416 |
| 7 | 256,7 | 352,3 | 406 | 485,3 |
| 8 | 293,3 | 402,7 | 464 | 554,7 |
| 9 | 330 | 453 | 522 | 624 |

La proporción es pareja: **50 mallas por persona pagan lo mismo**, independiente del tamaño del equipo.

### Casos de prueba oficiales

#### 4 personas

| Mallas | Líquido/persona | ×22 días |
|---:|---:|---:|
| 151 | $1.135 | $24.962 |
| 174 | $3.004 | $66.079 |
| 210 | $5.390 | $118.578 |
| 288 | $8.291 | $182.406 |

#### 5 personas

| Mallas | Líquido/persona | ×22 días |
|---:|---:|---:|
| 188 | $1.086 | $23.889 |
| 218 | $3.036 | $66.794 |
| 260 | $5.242 | $115.328 |
| 357 | $8.291 | $182.406 |

Estos casos deben usarse como tests de regresión al replicar o modificar la calculadora.

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
