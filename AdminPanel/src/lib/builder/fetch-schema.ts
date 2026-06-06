/**
 * Fetch builder schema for the storefront (server-side).
 * 
 * Used by the dynamic homepage to load sections from DB.
 */

import { query } from "@/lib/db";
import type { BuilderSchema } from "@/lib/builder/types";

export async function getBuilderSchema(siteId: string = "quirkyhome"): Promise<BuilderSchema | null> {
  try {
    let result = await query<{ schema_json: BuilderSchema }>(
      "select schema_json from builder_pages where id = 'main' and site_id = $1 limit 1",
      [siteId],
    );

    // Fallback: if requested site has no schema, use the most recently updated schema.
    if (result.rows.length === 0 || !result.rows[0]?.schema_json) {
      result = await query<{ schema_json: BuilderSchema }>(
        "select schema_json from builder_pages where id = 'main' order by updated_at desc limit 1",
      );
    }

    if (result.rows.length > 0 && result.rows[0].schema_json) {
      return result.rows[0].schema_json as BuilderSchema;
    }
    return null;
  } catch {
    return null;
  }
}
