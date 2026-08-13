export const OFFICE_HALF_X = 27;
export const OFFICE_HALF_Z = 19;
export const CITY_HALF_X = 96;
export const CITY_HALF_Z = 78;

export type AzabuCityLot = {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  variant: number;
};

export type AzabuStreetProp = {
  id: string;
  name: string;
  kind: "vending" | "lamp" | "sign" | "tree";
  x: number;
  z: number;
  variant: number;
};

const sideLots: AzabuCityLot[] = [];
const sideZ = [-58, -30, 0, 30, 58];
for (const x of [-72, -48, 48, 72]) {
  for (const z of sideZ) {
    const variant = sideLots.length;
    sideLots.push({
      id: `side-${variant}`,
      name: x < 0 ? "麻布十番・西街区ビル" : "麻布十番・東街区ビル",
      x,
      z,
      width: variant % 2 === 0 ? 12 : 10,
      depth: variant % 3 === 0 ? 13 : 11,
      floors: 3 + variant % 3,
      variant,
    });
  }
}

const capLots: AzabuCityLot[] = [];
for (const z of [-46, 46]) {
  for (const x of [-24, 0, 24]) {
    const variant = sideLots.length + capLots.length;
    capLots.push({
      id: `cap-${variant}`,
      name: z < 0 ? "麻布十番・北街区ビル" : "麻布十番商店街ビル",
      x,
      z,
      width: 11 + variant % 2,
      depth: 12,
      floors: 3 + variant % 3,
      variant,
    });
  }
}

export const AZABU_CITY_LOTS: readonly AzabuCityLot[] = [
  ...sideLots,
  ...capLots,
];

const propKinds: readonly AzabuStreetProp["kind"][] = [
  "vending",
  "lamp",
  "sign",
  "tree",
];
const streetProps: AzabuStreetProp[] = [];
for (const x of [-34, 34]) {
  for (const z of [-62, -45, -28, -10, 10, 28, 45, 62]) {
    const variant = streetProps.length;
    const kind = propKinds[variant % propKinds.length] ?? "sign";
    streetProps.push({
      id: `vertical-${variant}`,
      name: kind === "vending"
        ? "商店街の自販機"
        : kind === "lamp"
          ? "麻布十番街路灯"
          : kind === "tree"
            ? "街路樹"
            : "商店街案内板",
      kind,
      x,
      z,
      variant,
    });
  }
}
for (const z of [-24, 24]) {
  for (const x of [-84, -66, -48, -30, 30, 48, 66, 84]) {
    const variant = streetProps.length;
    const kind = propKinds[variant % propKinds.length] ?? "sign";
    streetProps.push({
      id: `horizontal-${variant}`,
      name: kind === "vending"
        ? "商店街の自販機"
        : kind === "lamp"
          ? "麻布十番街路灯"
          : kind === "tree"
            ? "街路樹"
            : "商店街案内板",
      kind,
      x,
      z,
      variant,
    });
  }
}

export const AZABU_STREET_PROPS: readonly AzabuStreetProp[] = streetProps;

// Every lot has one breakable per floor, one storefront and one steel rooftop.
export const AZABU_CITY_BREAKABLE_COUNT = AZABU_CITY_LOTS.reduce(
  (total, lot) => total + lot.floors + 2,
  AZABU_STREET_PROPS.length,
);

export function isOfficeExteriorWall(id: string) {
  return id.startsWith("north-wall-") || id.startsWith("side-wall-");
}

export function getGiantScale(cityDestroyed: number, cityTotal: number) {
  if (cityTotal <= 0) return 1;
  const ratio = Math.max(0, Math.min(1, cityDestroyed / cityTotal));
  const eased = 1 - Math.pow(1 - ratio, 1.35);
  return 1 + eased * 4.2;
}

export function getGiantStage(scale: number) {
  if (scale >= 4.7) return 4;
  if (scale >= 3.6) return 3;
  if (scale >= 2.5) return 2;
  if (scale >= 1.55) return 1;
  return 0;
}
