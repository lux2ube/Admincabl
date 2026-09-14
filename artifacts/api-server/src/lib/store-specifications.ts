import { pool } from "@workspace/db";
import type {
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
  attributes: [],
  ports: [],
  protocols: [],
  powerProfiles: [],
  dimensions: null,
  protections: [],
  compatibility: [],
  maxPowerW: null,
  capabilityLabel: null,
});

export async function fetchStoreSpecifications(productIds: string[]) {
  const specifications = new Map<string, StoreSpecifications>(
    productIds.map((productId) => [productId, emptyStoreSpecifications()]),
  );
  if (!productIds.length) return specifications;

  const [attributes, ports, protocols, profiles, outputs, dimensions, protections, compatibility] = await Promise.all([
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
  ]);

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
    specifications.set(productId, {
      attributes: mappedAttributes,
      ports: portsByProduct.get(productId) ?? [],
      protocols: mappedProtocols,
      powerProfiles: profilesByProduct.get(productId) ?? [],
      dimensions: mappedDimensions,
      protections: mappedProtections,
      compatibility: mappedCompatibility,
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
  const result = await pool.query<{
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
     GROUP BY a."slug", a."attribute_name", a."unit", a."sort_order"
     ORDER BY a."sort_order" ASC, a."attribute_name" ASC`,
    params,
  );
  return {
    filters: result.rows.filter((row) => row.slug).map((row) => ({
      slug: row.slug,
      label: row.label,
      unit: row.unit,
      values: row.values.filter(Boolean),
    })),
  };
}