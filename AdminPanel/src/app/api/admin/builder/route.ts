import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

type AnySchema = {
  themeSettings?: Record<string, unknown>;
  pages?: Record<string, { name?: string; slug?: string; sections?: any[] }>;
};

function normalizeMojibake(input: unknown): unknown {
  if (typeof input === "string") {
    return input
      .replace(/â‚¹/g, "Rs. ")
      .replace(/Ã—/g, "x");
  }
  if (Array.isArray(input)) return input.map(normalizeMojibake);
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = normalizeMojibake(v);
    }
    return out;
  }
  return input;
}

function policySection(title: string, body: string) {
  return {
    id: `seo-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    type: "SeoArticle",
    visible: true,
    settings: {
      content: `<h1>${title}</h1><p>${body}</p>`,
    },
  };
}

function buildRequiredPages() {
  return {
    bedding: { name: "Bedding", slug: "bedding", sections: [] },
    furnishing: { name: "Furnishing", slug: "furnishing", sections: [] },
    organiser: { name: "Organiser", slug: "organiser", sections: [] },
    bath: { name: "Bath", slug: "bath", sections: [] },
    gifts: { name: "Gifts", slug: "gifts", sections: [] },
    "new-arrival": { name: "New Arrival", slug: "new-arrival", sections: [] },
    comforters: { name: "Comforters", slug: "comforters", sections: [] },
    carpet: { name: "Carpet", slug: "carpet", sections: [] },
    "return-and-exchange": {
      name: "Return and Exchange",
      slug: "return-and-exchange",
      sections: [policySection("Return and Exchange", "Read our return and exchange process, eligibility criteria, timelines and support details.")],
    },
    "about-us": {
      name: "About Us",
      slug: "about-us",
      sections: [policySection("About Us", "Learn about our brand, design philosophy and the values behind our product curation.")],
    },
    "contact-us": {
      name: "Contact Us",
      slug: "contact-us",
      sections: [policySection("Contact Us", "Get in touch with our team for orders, shipping, support and partnerships.")],
    },
    "terms-and-conditions": {
      name: "Terms and Conditions",
      slug: "terms-and-conditions",
      sections: [policySection("Terms and Conditions", "Review our terms of service, order policies, payment terms and legal usage conditions.")],
    },
    "privacy-policy": {
      name: "Privacy Policy",
      slug: "privacy-policy",
      sections: [policySection("Privacy Policy", "Understand how we collect, use and protect your information across our platform.")],
    },
  } as Record<string, { name: string; slug: string; sections: any[] }>;
}

function withRequiredPages(raw: AnySchema | null) {
  const schema: AnySchema = (normalizeMojibake(raw && typeof raw === "object" ? raw : {}) as AnySchema) || {};
  const pages = schema.pages && typeof schema.pages === "object" ? { ...schema.pages } : {};
  const requiredPages = buildRequiredPages();
  let changed = false;

  for (const [key, page] of Object.entries(requiredPages)) {
    if (!pages[key]) {
      pages[key] = page;
      changed = true;
      continue;
    }
    if (!pages[key].name) {
      pages[key].name = page.name;
      changed = true;
    }
    if (!pages[key].slug) {
      pages[key].slug = page.slug;
      changed = true;
    }
    if (!Array.isArray(pages[key].sections)) {
      pages[key].sections = page.sections;
      changed = true;
    }
  }

  if (!schema.pages || changed) schema.pages = pages;
  return { schema, changed };
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "online_store.edit");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const { schema, site_id = "quirkyhome" } = body;

    if (!schema) {
      return NextResponse.json({ error: "Missing schema" }, { status: 400 });
    }

    // Save the schema to the database
    await query(
      `INSERT INTO builder_pages (id, site_id, schema_json, updated_at)
       VALUES ('main', $1, $2, now())
       ON CONFLICT (id, site_id)
       DO UPDATE SET schema_json = EXCLUDED.schema_json, updated_at = now()`,
      [site_id, JSON.stringify(schema)]
    );

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "builder",
      action: "save",
      entityType: "storefront_schema",
      entityId: site_id,
      entityLabel: site_id,
      message: "Saved storefront builder schema.",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save builder schema:", error);
    return NextResponse.json({ error: "Failed to save schema" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "online_store.view");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const site_id = searchParams.get("site_id") || "quirkyhome";

    const result = await query(
      "SELECT schema_json FROM builder_pages WHERE id = 'main' AND site_id = $1 LIMIT 1",
      [site_id]
    );

    if (result.rows.length > 0 && result.rows[0].schema_json) {
      const { schema, changed } = withRequiredPages(result.rows[0].schema_json as AnySchema);
      if (changed) {
        await query(
          `INSERT INTO builder_pages (id, site_id, schema_json, updated_at)
           VALUES ('main', $1, $2, now())
           ON CONFLICT (id, site_id)
           DO UPDATE SET schema_json = EXCLUDED.schema_json, updated_at = now()`,
          [site_id, JSON.stringify(schema)]
        );
      }
      return NextResponse.json({ schema });
    }

    const { schema } = withRequiredPages({ pages: { home: { name: "Home Page", slug: "home", sections: [] } } });
    return NextResponse.json({ schema });
  } catch (error) {
    console.error("Failed to fetch builder schema:", error);
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 });
  }
}
