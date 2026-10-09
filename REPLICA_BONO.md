# Replica del Bono de Produccion — THE ICE

## Objetivo

Este documento permite replicar la logica del bono sin depender de la UI actual de Camino al Bono.

La fuente de verdad tecnica es:

- `bonus-engine.js`
- esta especificacion
- los casos de prueba incluidos al final

## Regla de negocio

1. Cada malla equivalente representa 15 kg.
2. Para el calculo oficial manda el kg real registrado.
3. Cada kg aporta $72 a la base de ahorro.
4. Al total se le resta el costo del turno: $37.000 por persona.
5. El bono se activa solo desde N1.
6. Segun el nivel, una parte del ahorro forma el pozo:
   - N1: 55%
   - N2: 50%
   - N3: 40%
   - N4: 30%
7. El pozo se reparte en partes iguales.
8. Del pozo individual, 72% corresponde al bruto de bono.
9. Al bruto se le descuenta 24% legal.
10. El pozo nunca baja al cruzar de nivel.

## Formula

```text
kg = kg real registrado

costo_turno = personas * 37000
ahorro = max(0, kg * 72 - costo_turno)

pozo_raw = ahorro * porcentaje_nivel

bruto_persona = (pozo_protegido / personas) * 0.72
liquido_persona = bruto_persona * 0.76
```

Factor efectivo desde pozo individual a liquido:

```text
0.72 * 0.76 = 0.5472
```

## Regla "el pozo nunca baja"

No basta con cambiar de 55% a 50%, de 50% a 40% o de 40% a 30%.

Al entrar a un nivel nuevo:

```text
piso_del_nivel =
  ahorro_calculado_en_el_umbral_exacto
  * porcentaje_del_nivel_anterior

pozo_protegido = max(pozo_raw, todos_los_pisos_ya_cruzados)
```

Ejemplo: al entrar a N4 se conserva como piso el pozo que se habria calculado en ese mismo umbral usando 40%.

Esto explica por que un dia grande puede seguir pagando mas que la formula raw de N4 durante un tramo.

## Umbrales oficiales

Los kg son la fuente exacta. La columna de mallas es solo una visualizacion de kg / 15.

| Personas | N1 mallas | N1 kg | N2 mallas | N2 kg | N3 mallas | N3 kg | N4 mallas | N4 kg |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 3 | 110 | 1650 | 151 | 2265 | 174 | 2610 | 208 | 3120 |
| 4 | 146,7 | 2200 | 201,3 | 3020 | 232 | 3480 | 277,3 | 4160 |
| 5 | 183,3 | 2750 | 251,7 | 3775 | 290 | 4350 | 346,7 | 5200 |
| 6 | 220 | 3300 | 302 | 4530 | 348 | 5220 | 416 | 6240 |
| 7 | 256,7 | 3850 | 352,3 | 5285 | 406 | 6090 | 485,3 | 7280 |
| 8 | 293,3 | 4400 | 402,7 | 6040 | 464 | 6960 | 554,7 | 8320 |
| 9 | 330 | 4950 | 453 | 6795 | 522 | 7830 | 624 | 9360 |

## Proporcionalidad

La regla buscada es:

**mismo esfuerzo por persona = misma plata por persona**

Por eso el modelo escala los umbrales proporcionalmente por cantidad de personas y usa el mismo costo por persona.

## Casos de prueba oficiales

Una replica no se considera correcta si no reproduce estos resultados redondeados al peso.

### 4 personas

| Mallas | Liquido por persona | x22 dias |
|---:|---:|---:|
| 151 | $1.135 | $24.962 |
| 174 | $3.004 | $66.079 |
| 210 | $5.390 | $118.578 |
| 288 | $8.291 | $182.406 |

### 5 personas

| Mallas | Liquido por persona | x22 dias |
|---:|---:|---:|
| 188 | $1.086 | $23.889 |
| 218 | $3.036 | $66.794 |
| 260 | $5.242 | $115.328 |
| 357 | $8.291 | $182.406 |

## Implementacion recomendada

Usar `bonus-engine.js` como modulo aislado.

Ejemplo:

```js
import {
  calculateBonus,
  roundCLP,
  thresholdBags
} from "./bonus-engine.js";

const result = calculateBonus({
  people: 5,
  kg: 3270
});

console.log(roundCLP(result.liquidPerPerson));
// 3036

console.log(thresholdBags(5));
// [183.333..., 251.666..., 290, 346.666...]
```

Si solo existe cantidad de mallas:

```js
calculateBonus({
  people: 5,
  bags: 218
});
```

Pero para cierre oficial siempre se debe preferir `kg`.

## Campos utiles que devuelve el motor

```text
people
kg
bagsEquivalent
level
laborCost
saving
share
rawPool
protectedPool
grossPerPerson
liquidPerPerson
legalDiscountAmountPerPerson
protected
```

## Reglas para una replica

- No recalcular umbrales desde una formula aproximada: usar los kg oficiales de la tabla.
- No redondear durante el calculo.
- Redondear a CLP solo al mostrar o guardar el resultado final.
- El porcentaje de nivel se determina por kg real.
- Bajo N1: bono = 0.
- La proteccion de pozo se evalua contra cada umbral ya cruzado.
- Los integrantes del turno reciben el mismo monto.
- No usar factores distintos por cantidad de personas.
- No usar 76% como unico factor: el calculo final es 72% y luego descuento de 24%.

## Version

**Octubre 2026 — especificacion final aprobada para Camino al Bono.**
