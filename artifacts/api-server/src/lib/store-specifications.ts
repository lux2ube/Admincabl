import { pool } from "@workspace/db";
import type {
  StoreCableSpecifications,
  StoreCarChargerSpecifications,
  StorePowerBankSpecifications,
  StoreSpecificationDefinition,
  StoreSpecifications,
  StoreSpecificationAttribute,
  StoreSpecificationCompatibility,
  StoreSpecificationDimensions,
  StoreSpecificationPort,
  StoreSpecificationPowerProfile,
  StoreSpecificationPowerOutput,
  StoreSpecificationProtection,
  StoreSpecificationProtocol,
} from "@workspace/api-zod";

type NumericValue = string | number | null;

const numberOrNull = (value: NumericValue) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const emptyStoreSpecifications = (): StoreSpecifications => ({
  categorySlug: null,
  fieldDefinitions: [],
  attributes: [],
  ports: [],
  protocols: [],
  powerProfiles: [],
  dimensions: null,
  protections: [],
  compatibility: [],
  warrantyMonths: null,
  warrantyNote: null,
  powerBank: null,
  cable: null,
  carCharger: null,
  maxPowerW: null,
  capabilityLabel: null,
});

export async function fetchStoreSpecifications(productIds: string[]) {
  const specifications = new Map<string, StoreSpecifications>(
    productIds.map((productId) => [productId, emptyStoreSpecifications()]),
  );
  if (!productIds.length) return specifications;

  const [categories, definitions, attributes, ports, protocols, profiles, outputs, dimensions, protections, compatibility, warranties, powerBanks, cables, carChargers] = await Promise.all([
    pool.query<{ product_id: string; slug: string | null }>(
      `SELECT DISTINCT ON (pc."product_id") pc."product_id", c."slug"
       FROM "product_categories" pc
       JOIN "categories" c ON c."id" = pc."category_id" AND c."active" = TRUE
       WHERE pc."product_id" = ANY($1::uuid[])
       ORDER BY pc."product_id", c."parent_id" NULLS FIRST, c."category_name"`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      slug: string;
      label: string;
      group_name: string;
      value_type: "text" | "number" | "boolean" | "select" | "multiselect";
      unit: string | null;
    }>(
      `SELECT DISTINCT ON (pc."product_id", sd."id")
              pc."product_id", sd."slug", sd."label", sd."group_name", sd."value_type", sd."unit"
       FROM "product_categories" pc
       JOIN "category_specification_definitions" csd ON csd."category_id" = pc."category_id" AND csd."visible" = TRUE
       JOIN "specification_definitions" sd ON sd."id" = csd."definition_id" AND sd."active" = TRUE
       WHERE pc."product_id" = ANY($1::uuid[])
       ORDER BY pc."product_id", sd."id", sd."sort_order" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      slug: string | null;
      label: string;
      type: "text" | "number" | "boolean" | "select" | "multiselect";
      unit: string | null;
      value_text: string | null;
      value_number: NumericValue;
      value_boolean: boolean | null;
      source_url: string | null;
    }>(
      `SELECT pa."product_id", a."slug", a."attribute_name" AS "label", a."type", a."unit",
              pa."value_text", pa."value_number", pa."value_boolean", pa."source_url"
       FROM "product_attributes" pa
       JOIN "attributes" a ON a."id" = pa."attribute_id" AND a."is_active" = TRUE
       WHERE pa."product_id" = ANY($1::uuid[])
         AND (a."category_id" IS NULL OR EXISTS (
           SELECT 1 FROM "product_categories" pac
           WHERE pac."product_id" = pa."product_id" AND pac."category_id" = a."category_id"
         ))
       ORDER BY a."sort_order" ASC, a."attribute_name" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      id: string;
      port_name: string;
      port_type: string;
      max_power_w: NumericValue;
      max_voltage_v: NumericValue;
      max_current_a: NumericValue;
    }>(
      `SELECT cp."product_id", cp."id", cp."port_name", pt."name" AS "port_type",
              cp."max_power_w", cp."max_voltage_v", cp."max_current_a"
       FROM "charger_ports" cp
       JOIN "port_types" pt ON pt."id" = cp."port_type_id" AND pt."active" = TRUE
       WHERE cp."product_id" = ANY($1::uuid[])
       ORDER BY cp."sort_order" ASC, cp."port_name" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      name: string;
      slug: string;
      port_id: string | null;
    }>(
      `SELECT pcp."product_id", p."name", p."slug", pcp."port_id"
       FROM "product_charging_protocols" pcp
       JOIN "charging_protocols" p ON p."id" = pcp."protocol_id" AND p."active" = TRUE
       WHERE pcp."product_id" = ANY($1::uuid[])
       ORDER BY p."name" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      id: string;
      configuration_name: string;
      total_power_w: NumericValue;
      description: string | null;
    }>(
      `SELECT "product_id", "id", "configuration_name", "total_power_w", "description"
       FROM "charger_power_profiles"
       WHERE "product_id" = ANY($1::uuid[])
       ORDER BY "sort_order" ASC, "configuration_name" ASC`,
      [productIds],
    ),
    pool.query<{
      profile_id: string;
      port_id: string;
      power_w: NumericValue;
    }>(
      `SELECT "profile_id", "port_id", "power_w"
       FROM "charger_power_profile_outputs"
       WHERE "profile_id" IN (
         SELECT "id" FROM "charger_power_profiles" WHERE "product_id" = ANY($1::uuid[])
       )`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      length_mm: NumericValue;
      width_mm: NumericValue;
      height_mm: NumericValue;
      weight_g: NumericValue;
    }>(
      `SELECT "product_id", "length_mm", "width_mm", "height_mm", "weight_g"
       FROM "product_dimensions"
       WHERE "product_id" = ANY($1::uuid[])`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      name: string;
      slug: string;
    }>(
      `SELECT pp."product_id", pt."name", pt."slug"
       FROM "product_protections" pp
       JOIN "protection_types" pt ON pt."id" = pp."protection_id" AND pt."active" = TRUE
       WHERE pp."product_id" = ANY($1::uuid[])
       ORDER BY pt."name" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      name: string;
      slug: string;
      compatibility_type: "supported" | "partially_supported" | "not_recommended";
      notes: string | null;
    }>(
      `SELECT pc."product_id", cc."name", cc."slug", pc."compatibility_type", pc."notes"
       FROM "product_compatibility" pc
       JOIN "compatibility_categories" cc ON cc."id" = pc."compatibility_category_id" AND cc."active" = TRUE
       WHERE pc."product_id" = ANY($1::uuid[])
       ORDER BY cc."name" ASC`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      warranty_months: NumericValue;
      warranty_note: string | null;
    }>(
      `SELECT "product_id", "warranty_months", "warranty_note"
       FROM "product_warranties"
       WHERE "product_id" = ANY($1::uuid[])`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      capacity_mah: NumericValue;
      energy_wh: NumericValue;
      input_summary: string | null;
      output_summary: string | null;
      max_output_w: NumericValue;
      recharge_time_hours: NumericValue;
      wireless_charging: boolean | null;
      display: boolean | null;
      pass_through_charging: boolean | null;
    }>(
      `SELECT "product_id", "capacity_mah", "energy_wh", "input_summary", "output_summary",
              "max_output_w", "recharge_time_hours", "wireless_charging", "display", "pass_through_charging"
       FROM "power_bank_specifications"
       WHERE "product_id" = ANY($1::uuid[])`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      connector_a: string | null;
      connector_b: string | null;
      length_m: NumericValue;
      max_power_w: NumericValue;
      data_speed_gbps: NumericValue;
      usb_version: string | null;
      e_marker: boolean | null;
      video_support: boolean | null;
      material: string | null;
    }>(
      `SELECT "product_id", "connector_a", "connector_b", "length_m", "max_power_w",
              "data_speed_gbps", "usb_version", "e_marker", "video_support", "material"
       FROM "cable_specifications"
       WHERE "product_id" = ANY($1::uuid[])`,
      [productIds],
    ),
    pool.query<{
      product_id: string;
      input_voltage_v: string | null;
      max_output_w: NumericValue;
      power_distribution: string | null;
      car_compatibility: string | null;
    }>(
      `SELECT "product_id", "input_voltage_v", "max_output_w", "power_distribution", "car_compatibility"
       FROM "car_charger_specifications"
       WHERE "product_id" = ANY($1::uuid[])`,
      [productIds],
    ),
  ]);

  const categoryByProduct = new Map(categories.rows.map((row) => [row.product_id, row.slug]));
  const definitionsByProduct = new Map<string, StoreSpecificationDefinition[]>();
  for (const row of definitions.rows) {
    const list = definitionsByProduct.get(row.product_id) ?? [];
    list.push({ slug: row.slug, label: row.label, group: row.group_name, type: row.value_type, unit: row.unit });
    definitionsByProduct.set(row.product_id, list);
  }
  const warrantyByProduct = new Map(warranties.rows.map((row) => [row.product_id, row]));
  const powerBankByProduct = new Map<string, StorePowerBankSpecifications>(powerBanks.rows.map((row) => [row.product_id, {
    capacityMah: numberOrNull(row.capacity_mah),
    energyWh: numberOrNull(row.energy_wh),
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    maxOutputW: numberOrNull(row.max_output_w),
    rechargeTimeHours: numberOrNull(row.recharge_time_hours),
    wirelessCharging: row.wireless_charging,
    display: row.display,
    passThroughCharging: row.pass_through_charging,
  }]));
  const cableByProduct = new Map<string, StoreCableSpecifications>(cables.rows.map((row) => [row.product_id, {
    connectorA: row.connector_a,
    connectorB: row.connector_b,
    lengthM: numberOrNull(row.length_m),
    maxPowerW: numberOrNull(row.max_power_w),
    dataSpeedGbps: numberOrNull(row.data_speed_gbps),
    usbVersion: row.usb_version,
    eMarker: row.e_marker,
    videoSupport: row.video_support,
    material: row.material,
  }]));
  const carChargerByProduct = new Map<string, StoreCarChargerSpecifications>(carChargers.rows.map((row) => [row.product_id, {
    inputVoltageV: row.input_voltage_v,
    maxOutputW: numberOrNull(row.max_output_w),
    powerDistribution: row.power_distribution,
    carCompatibility: row.car_compatibility,
  }]));

  const portsByProduct = new Map<string, StoreSpecificationPort[]>();
  for (const row of ports.rows) {
    const list = portsByProduct.get(row.product_id) ?? [];
    list.push({
      id: row.id,
      name: row.port_name,
      type: row.port_type,
      maxPowerW: numberOrNull(row.max_power_w),
      maxVoltageV: numberOrNull(row.max_voltage_v),
      maxCurrentA: numberOrNull(row.max_current_a),
    });
    portsByProduct.set(row.product_id, list);
  }

  const outputsByProfile = new Map<string, StoreSpecificationPowerOutput[]>();
  for (const row of outputs.rows) {
    const list = outputsByProfile.get(row.profile_id) ?? [];
    const powerW = numberOrNull(row.power_w);
    if (powerW !== null) list.push({ portId: row.port_id, powerW });
    outputsByProfile.set(row.profile_id, list);
  }

  const profilesByProduct = new Map<string, StoreSpecificationPowerProfile[]>();
  for (const row of profiles.rows) {
    const list = profilesByProduct.get(row.product_id) ?? [];
    list.push({
      name: row.configuration_name,
      totalPowerW: numberOrNull(row.total_power_w),
      description: row.description,
      outputs: outputsByProfile.get(row.id) ?? [],
    });
    profilesByProduct.set(row.product_id, list);
  }

  for (const productId of productIds) {
    const current = specifications.get(productId) ?? emptyStoreSpecifications();
    const productAttributes = attributes.rows.filter((row) => row.product_id === productId);
    const mappedAttributes: StoreSpecificationAttribute[] = productAttributes
      .filter((row) => row.slug)
      .map((row) => {
        const values = row.type === "multiselect" ? (row.value_text ?? "").split(",").map((value) => value.trim()).filter(Boolean) : [];
        const value = row.type === "number"
          ? numberOrNull(row.value_number)
          : row.type === "boolean"
            ? row.value_boolean
            : row.value_text;
        return {
          slug: row.slug!,
          label: row.label,
          type: row.type,
          value,
          values,
          unit: row.unit,
          sourceUrl: row.source_url,
        };
      });
    const maxAttribute = mappedAttributes.find((attribute) => attribute.slug === "max_power_w");
    const maxFromAttribute = maxAttribute && typeof maxAttribute.value === "number" ? maxAttribute.value : null;
    const maxFromPorts = Math.max(0, ...(portsByProduct.get(productId) ?? []).map((port) => port.maxPowerW ?? 0));
    const maxFromProfiles = Math.max(0, ...(profilesByProduct.get(productId) ?? []).map((profile) => profile.totalPowerW ?? 0));
    const maxPowerW = Math.max(maxFromAttribute ?? 0, maxFromPorts, maxFromProfiles) || null;
    const dimension = dimensions.rows.find((row) => row.product_id === productId);
    const mappedDimensions: StoreSpecificationDimensions | null = dimension
      ? {
        lengthMm: numberOrNull(dimension.length_mm),
        widthMm: numberOrNull(dimension.width_mm),
        heightMm: numberOrNull(dimension.height_mm),
        weightG: numberOrNull(dimension.weight_g),
      }
      : null;
    const mappedProtocols: StoreSpecificationProtocol[] = protocols.rows
      .filter((row) => row.product_id === productId)
      .map((row) => ({ name: row.name, slug: row.slug, portId: row.port_id }));
    const mappedProtections: StoreSpecificationProtection[] = protections.rows
      .filter((row) => row.product_id === productId)
      .map((row) => ({ name: row.name, slug: row.slug }));
    const mappedCompatibility: StoreSpecificationCompatibility[] = compatibility.rows
      .filter((row) => row.product_id === productId)
      .map((row) => ({
        name: row.name,
        slug: row.slug,
        type: row.compatibility_type,
        notes: row.notes,
      }));
    const warranty = warrantyByProduct.get(productId);
    specifications.set(productId, {
      categorySlug: categoryByProduct.get(productId) ?? null,
      fieldDefinitions: definitionsByProduct.get(productId) ?? [],
      attributes: mappedAttributes,
      ports: portsByProduct.get(productId) ?? [],
      protocols: mappedProtocols,
      powerProfiles: profilesByProduct.get(productId) ?? [],
      dimensions: mappedDimensions,
      protections: mappedProtections,
      compatibility: mappedCompatibility,
      warrantyMonths: warranty ? numberOrNull(warranty.warranty_months) : null,
      warrantyNote: warranty?.warranty_note ?? null,
      powerBank: powerBankByProduct.get(productId) ?? null,
      cable: cableByProduct.get(productId) ?? null,
      carCharger: carChargerByProduct.get(productId) ?? null,
      maxPowerW,
      capabilityLabel: maxPowerW ? `حتى ${maxPowerW}W` : null,
    });
  }

  return specifications;
}

export async function fetchStoreSpecificationFilters(categorySlug?: string) {
  const params = categorySlug ? [categorySlug] : [];
  const categoryJoin = categorySlug
    ? `JOIN "product_categories" pcf ON pcf."product_id" = pa."product_id"
       JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1`
    : "";
  const [result, moduleResult] = await Promise.all([
    pool.query<{
    slug: string;
    label: string;
    unit: string | null;
    values: string[];
    }>(
    `SELECT a."slug", a."attribute_name" AS "label", a."unit",
            ARRAY_AGG(DISTINCT COALESCE(pa."value_text", pa."value_number"::text, pa."value_boolean"::text) ORDER BY COALESCE(pa."value_text", pa."value_number"::text, pa."value_boolean"::text)) AS "values"
     FROM "product_attributes" pa
     JOIN "attributes" a ON a."id" = pa."attribute_id"
     ${categoryJoin}
       WHERE a."is_active" = TRUE AND a."is_filterable" = TRUE
         AND (a."category_id" IS NULL OR a."category_id" = cf."id")
     GROUP BY a."slug", a."attribute_name", a."unit", a."sort_order"
     ORDER BY a."sort_order" ASC, a."attribute_name" ASC`,
    params,
    ),
    pool.query<{
      slug: string;
      label: string;
      unit: string | null;
      values: string[];
    }>(
      `SELECT "slug", "label", "unit",
              ARRAY_AGG(DISTINCT "value" ORDER BY "value") AS "values"
       FROM (
         SELECT 'capacity_mah' AS "slug", 'السعة' AS "label", 'mAh' AS "unit", pb."capacity_mah"::text AS "value"
         FROM "power_bank_specifications" pb
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = pb."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE pb."capacity_mah" IS NOT NULL
         UNION ALL
         SELECT 'energy_wh', 'الطاقة', 'Wh', pb."energy_wh"::text
         FROM "power_bank_specifications" pb
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = pb."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE pb."energy_wh" IS NOT NULL
         UNION ALL
         SELECT 'max_output_w', 'أقصى خرج', 'W', pb."max_output_w"::text
         FROM "power_bank_specifications" pb
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = pb."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE pb."max_output_w" IS NOT NULL
         UNION ALL
         SELECT 'length_m', 'الطول', 'm', c."length_m"::text
         FROM "cable_specifications" c
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = c."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE c."length_m" IS NOT NULL
         UNION ALL
         SELECT 'max_power_w', 'القدرة القصوى', 'W', c."max_power_w"::text
         FROM "cable_specifications" c
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = c."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE c."max_power_w" IS NOT NULL
         UNION ALL
         SELECT 'data_speed_gbps', 'سرعة نقل البيانات', 'Gbps', c."data_speed_gbps"::text
         FROM "cable_specifications" c
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = c."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE c."data_speed_gbps" IS NOT NULL
         UNION ALL
         SELECT 'max_output_w', 'أقصى خرج', 'W', cc."max_output_w"::text
         FROM "car_charger_specifications" cc
         ${categorySlug ? `JOIN "product_categories" pcf ON pcf."product_id" = cc."product_id" JOIN "categories" cf ON cf."id" = pcf."category_id" AND cf."slug" = $1` : ""}
         WHERE cc."max_output_w" IS NOT NULL
       ) values_by_field
       GROUP BY "slug", "label", "unit"
       ORDER BY "slug"`,
      params,
    ),
  ]);
  const merged = new Map<string, { slug: string; label: string; unit: string | null; values: string[] }>();
  for (const row of [...result.rows, ...moduleResult.rows]) {
    const current = merged.get(row.slug);
    merged.set(row.slug, current
      ? { ...current, values: [...new Set([...current.values, ...row.values].filter(Boolean))].sort() }
      : { ...row, values: row.values.filter(Boolean) });
  }
  return {
    filters: [...merged.values()].filter((row) => row.slug && row.values.length),
  };
}