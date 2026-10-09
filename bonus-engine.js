/**
 * THE ICE — Motor de Bono de Produccion
 * Version: Octubre 2026
 *
 * Fuente de verdad para replicas.
 * El calculo operativo debe recibir kg reales cuando esten disponibles.
 */

export const BONUS_CONFIG = Object.freeze({
  kgPerBag: 15,
  targetPerKg: 72,
  costPerPerson: 37000,
  grossFactor: 0.72,
  legalDiscount: 0.24,
  shares: Object.freeze({
    N1: 0.55,
    N2: 0.50,
    N3: 0.40,
    N4: 0.30,
  }),
  // Umbrales autoritativos en kg. Las mallas son solo una vista: kg / 15.
  thresholdsKg: Object.freeze({
    3: Object.freeze([1650, 2265, 2610, 3120]),
    4: Object.freeze([2200, 3020, 3480, 4160]),
    5: Object.freeze([2750, 3775, 4350, 5200]),
    6: Object.freeze([3300, 4530, 5220, 6240]),
    7: Object.freeze([3850, 5285, 6090, 7280]),
    8: Object.freeze([4400, 6040, 6960, 8320]),
    9: Object.freeze([4950, 6795, 7830, 9360]),
  }),
});

const LEVELS = ["N1", "N2", "N3", "N4"];

export function thresholdBags(people, config = BONUS_CONFIG) {
  const thresholds = config.thresholdsKg[people];
  if (!thresholds) throw new Error("Cantidad de personas no soportada: " + people);
  return thresholds.map((kg) => kg / config.kgPerBag);
}

export function calculateBonus({ kg, bags, people }, config = BONUS_CONFIG) {
  if (!Number.isFinite(people) || people < 1) {
    throw new Error("people debe ser un numero positivo");
  }

  const realKg = Number.isFinite(kg)
    ? Number(kg)
    : Number(bags) * config.kgPerBag;

  if (!Number.isFinite(realKg) || realKg < 0) {
    throw new Error("Debes informar kg reales o mallas validas");
  }

  const thresholds = config.thresholdsKg[people];
  if (!thresholds) {
    throw new Error("No hay umbrales configurados para " + people + " personas");
  }

  const laborCost = people * config.costPerPerson;
  const saving = Math.max(0, realKg * config.targetPerKg - laborCost);

  let levelIndex = -1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (realKg >= thresholds[i]) levelIndex = i;
  }

  if (levelIndex < 0 || saving <= 0) {
    return {
      people,
      kg: realKg,
      bagsEquivalent: realKg / config.kgPerBag,
      level: null,
      laborCost,
      saving,
      share: 0,
      rawPool: 0,
      protectedPool: 0,
      grossPerPerson: 0,
      liquidPerPerson: 0,
      legalDiscountAmountPerPerson: 0,
      protected: false,
    };
  }

  const level = LEVELS[levelIndex];
  const share = config.shares[level];
  const rawPool = saving * share;

  // Regla "el pozo nunca baja":
  // al cruzar N2/N3/N4 se conserva como piso el pozo que se habria
  // generado EN ESE MISMO UMBRAL con el porcentaje del nivel anterior.
  let protectedPool = rawPool;

  for (let crossed = 1; crossed <= levelIndex; crossed += 1) {
    const thresholdKg = thresholds[crossed];
    const savingAtThreshold = Math.max(
      0,
      thresholdKg * config.targetPerKg - laborCost
    );
    const previousLevel = LEVELS[crossed - 1];
    const floorPool = savingAtThreshold * config.shares[previousLevel];
    protectedPool = Math.max(protectedPool, floorPool);
  }

  const poolPerPerson = protectedPool / people;
  const grossPerPerson = poolPerPerson * config.grossFactor;
  const liquidPerPerson =
    grossPerPerson * (1 - config.legalDiscount);

  return {
    people,
    kg: realKg,
    bagsEquivalent: realKg / config.kgPerBag,
    level,
    laborCost,
    saving,
    share,
    rawPool,
    protectedPool,
    grossPerPerson,
    liquidPerPerson,
    legalDiscountAmountPerPerson: grossPerPerson - liquidPerPerson,
    protected: protectedPool > rawPool + 0.000001,
  };
}

export function roundCLP(value) {
  return Math.round(Number(value) || 0);
}

// Casos de regresion oficiales. Una replica debe pasar estos tests.
export const BONUS_TEST_CASES = Object.freeze([
  { people: 4, bags: 151, expectedLiquid: 1135 },
  { people: 4, bags: 174, expectedLiquid: 3004 },
  { people: 4, bags: 210, expectedLiquid: 5390 },
  { people: 4, bags: 288, expectedLiquid: 8291 },
  { people: 5, bags: 188, expectedLiquid: 1086 },
  { people: 5, bags: 218, expectedLiquid: 3036 },
  { people: 5, bags: 260, expectedLiquid: 5242 },
  { people: 5, bags: 357, expectedLiquid: 8291 },
]);

export function runBonusSelfTest(config = BONUS_CONFIG) {
  return BONUS_TEST_CASES.map((test) => {
    const result = calculateBonus(
      { people: test.people, bags: test.bags },
      config
    );
    const actual = roundCLP(result.liquidPerPerson);
    return {
      ...test,
      actualLiquid: actual,
      ok: actual === test.expectedLiquid,
    };
  });
}
