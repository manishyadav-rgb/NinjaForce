import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { query } from "@/lib/db";

const THEME_FILE = path.resolve(process.cwd(), "..", "theme-config.json");
const DEFAULT_THEME = { activePreset: "vibrant-sunshine", customOverrides: {} };
const DEFAULT_SITE_ID = "quirkyhome";

function readConfig() {
  try {
    const raw = fs.readFileSync(THEME_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_THEME;
  }
}

function writeConfig(config: Record<string, unknown>) {
  fs.writeFileSync(THEME_FILE, JSON.stringify(config, null, 2), "utf-8");
}

async function upsertThemeIntoBuilder(
  config: { activePreset: string; customOverrides: Record<string, string> },
  siteId: string,
) {
  const result = await query<{ schema_json: any }>(
    "select schema_json from builder_pages where id = 'main' and site_id = $1 limit 1",
    [siteId],
  );

  const schema = result.rows[0]?.schema_json || {
    themeSettings: {},
    pages: { home: { name: "Home Page", slug: "home", sections: [] } },
  };

  schema.themeSettings = schema.themeSettings || {};
  schema.themeSettings.activePreset = config.activePreset;
  schema.themeSettings.customOverrides = config.customOverrides;

  await query(
    `insert into builder_pages (id, schema_json, site_id, updated_at)
     values ('main', $1, $2, now())
     on conflict (id, site_id) do update
     set schema_json = $1, updated_at = now()`,
    [JSON.stringify(schema), siteId],
  );
}

/** GET /api/theme - Read current theme config */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site_id") || DEFAULT_SITE_ID;
  const fileConfig = readConfig();

  try {
    const result = await query<{ schema_json: any }>(
      "select schema_json from builder_pages where id = 'main' and site_id = $1 limit 1",
      [siteId],
    );

    const schema = result.rows[0]?.schema_json;
    const theme = schema?.themeSettings || {};

    // Legacy compatibility: if DB does not have preset keys yet, bootstrap from file/default.
    const hasPresetKeys = Boolean(theme.activePreset) || theme.customOverrides !== undefined;
    if (!hasPresetKeys) {
      const bootstrap = {
        activePreset: fileConfig.activePreset || DEFAULT_THEME.activePreset,
        customOverrides: fileConfig.customOverrides || DEFAULT_THEME.customOverrides,
      };
      await upsertThemeIntoBuilder(bootstrap, siteId);
      writeConfig(bootstrap);
      return NextResponse.json(bootstrap);
    }

    const config = {
      activePreset: theme.activePreset || DEFAULT_THEME.activePreset,
      customOverrides: theme.customOverrides || DEFAULT_THEME.customOverrides,
    };

    writeConfig(config);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(fileConfig);
  }
}

/** PUT /api/theme - Save theme config */
export async function PUT(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site_id") || body.site_id || DEFAULT_SITE_ID;
  const config = readConfig();
  if (body.activePreset) config.activePreset = body.activePreset;
  if (body.customOverrides !== undefined) config.customOverrides = body.customOverrides;

  try {
    await upsertThemeIntoBuilder({
      activePreset: config.activePreset || DEFAULT_THEME.activePreset,
      customOverrides: config.customOverrides || DEFAULT_THEME.customOverrides,
    }, siteId);

    writeConfig(config);

    return NextResponse.json({ ok: true, ...config });
  } catch {
    try {
      writeConfig(config);
      return NextResponse.json({ ok: true, ...config, warning: "Saved to local fallback only" });
    } catch {
      return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
    }
  }
}
