import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL is required to seed the shipping method.");
}

const pool = new Pool({ connectionString });
const method = {
  name: "توصيل ون",
  slug: "tawseel-yemen",
  description: "خدمة توصيل ون لطلبات CABL ضمن المدن اليمنية المحددة أدناه.",
  serviceCategories: ["المطاعم", "السوبرماركت", "المتاجر الإلكترونية"],
  charge: 0,
  free: true,
  seoTitle: "توصيل ون في اليمن: المدن والرسوم",
  metaDescription: "تعرّف على تغطية توصيل ون داخل اليمن، والمدن المشمولة، ورسوم التوصيل الحالية لطلبات CABL.",
};
const coverageCities = [
  ["صنعاء", "أمانة العاصمة", "Sana'a"],
  ["عدن", "عدن", "Aden"],
  ["تعز", "تعز", "Taiz"],
  ["الحديدة", "الحديدة", "Al Hudaydah"],
  ["إب", "إب", "Ibb"],
  ["ذمار", "ذمار", "Dhamar"],
  ["المكلا", "حضرموت", "Al Mukalla"],
];

async function seed() {
  const client = await pool.connect();
  let stage = "begin";
  try {
    await client.query("BEGIN");
    stage = "lock";
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [method.slug]);
    stage = "find-method";
    const existingMethod = await client.query(
      `SELECT "id" FROM "shippings" WHERE "slug" = $1 FOR UPDATE`,
      [method.slug],
    );
    let methodRow = existingMethod.rows[0];
    let methodCreated = false;
    if (!methodRow) {
      stage = "insert-method";
      await client.query(`LOCK TABLE "shippings" IN EXCLUSIVE MODE`);
      let candidateId;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const nextId = await client.query(
          `SELECT nextval(pg_get_serial_sequence('shippings', 'id')) AS "id"`,
        );
        candidateId = nextId.rows[0]?.id;
        if (!candidateId) throw new Error("Could not allocate a shipping method id.");
        const existingId = await client.query(`SELECT 1 FROM "shippings" WHERE "id" = $1`, [candidateId]);
        if (!existingId.rowCount) break;
        candidateId = undefined;
      }
      if (!candidateId) throw new Error("Could not find an unused shipping method id.");
      const insertedMethod = await client.query(
        `INSERT INTO "shippings"
          ("id", "name", "slug", "description", "service_categories", "default_charge", "default_free", "seo_title", "meta_description", "active")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
         RETURNING "id"`,
        [
          candidateId,
          method.name,
          method.slug,
          method.description,
          method.serviceCategories,
          method.charge,
          method.free,
          method.seoTitle,
          method.metaDescription,
        ],
      );
      methodRow = insertedMethod.rows[0];
      methodCreated = true;
    }
    if (!methodRow) throw new Error("Shipping method was not found after seed.");

    let insertedCityCount = 0;
    for (const [sortIndex, [cityNameAr, governorateNameAr, cityNameEn]] of coverageCities.entries()) {
      stage = `insert-coverage-${sortIndex + 1}`;
      const result = await client.query(
        `INSERT INTO "shipping_coverage_cities"
          ("shipping_id", "city_name_ar", "governorate_name_ar", "city_name_en", "active", "sort_order")
         VALUES ($1, $2, $3, $4, TRUE, $5)
         ON CONFLICT ("shipping_id", "city_name_ar") DO NOTHING`,
        [methodRow.id, cityNameAr, governorateNameAr, cityNameEn, sortIndex + 1],
      );
      insertedCityCount += result.rowCount || 0;
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({
      methodCreated,
      coverageCitiesInserted: insertedCityCount,
    }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error && typeof error === "object") {
      error.seedStage = stage;
    }
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
    const constraint = error && typeof error === "object" && "constraint" in error ? String(error.constraint) : "unknown";
    const stage = error && typeof error === "object" && "seedStage" in error ? String(error.seedStage) : "unknown";
    console.error(`Shipping seed failed during ${stage} (code: ${code}, constraint: ${constraint}).`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());