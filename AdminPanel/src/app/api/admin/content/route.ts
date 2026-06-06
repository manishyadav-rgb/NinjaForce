import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  image_alt: string | null;
  content_html: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureTable() {
  await query(`
    create table if not exists blog_posts (
      id bigserial primary key,
      title text not null,
      slug text not null unique,
      excerpt text,
      cover_image text,
      image_alt text,
      content_html text not null default '',
      published boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "content.view");
  if (guard.response) return guard.response;

  try {
    await ensureTable();
    const result = await query<PostRow>(
      `select id, title, slug, excerpt, cover_image, image_alt, content_html, published, created_at, updated_at
       from blog_posts
       order by updated_at desc`,
    );
    return Response.json({ posts: result.rows });
  } catch {
    return Response.json({ posts: [], error: "Failed to load content posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "content.edit");
  if (guard.response) return guard.response;

  try {
    await ensureTable();
    const body = await request.json();
    const id = Number(body?.id);
    const title = String(body?.title || "").trim();
    const slug = makeSlug(String(body?.slug || "") || title);
    const excerpt = String(body?.excerpt || "").trim();
    const coverImage = String(body?.coverImage || "").trim();
    const imageAlt = String(body?.imageAlt || "").trim();
    const contentHtml = String(body?.contentHtml || "");
    const published = body?.published !== false;

    if (!title || !slug) {
      return Response.json({ error: "Title and slug are required" }, { status: 400 });
    }

    if (Number.isFinite(id) && id > 0) {
      await query(
        `update blog_posts
         set title = $1, slug = $2, excerpt = $3, cover_image = $4, image_alt = $5, content_html = $6, published = $7, updated_at = now()
         where id = $8`,
        [title, slug, excerpt || null, coverImage || null, imageAlt || null, contentHtml, published, id],
      );
      await logAdminActivity(request, {
        id: guard.user!.id,
        email: guard.user!.email,
        fullName: guard.user!.full_name,
        role: guard.user!.role,
      }, {
        module: "content",
        action: "update",
        entityType: "post",
        entityId: String(id),
        entityLabel: title,
        message: `Updated content post ${title}.`,
        metadata: { slug, published },
      });
      return Response.json({ ok: true, id, slug });
    }

    const insertResult = await query<{ id: number }>(
      `insert into blog_posts (title, slug, excerpt, cover_image, image_alt, content_html, published, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       returning id`,
      [title, slug, excerpt || null, coverImage || null, imageAlt || null, contentHtml, published],
    );

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "content",
      action: "create",
      entityType: "post",
      entityId: String(insertResult.rows[0]?.id || ""),
      entityLabel: title,
      message: `Created content post ${title}.`,
      metadata: { slug, published },
    });

    return Response.json({ ok: true, id: insertResult.rows[0]?.id, slug });
  } catch (error) {
    return Response.json({ error: "Failed to save post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "content.edit");
  if (guard.response) return guard.response;

  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ error: "Valid id is required" }, { status: 400 });
    }
    const postResult = await query<{ title: string }>("select title from blog_posts where id = $1 limit 1", [id]);
    await query("delete from blog_posts where id = $1", [id]);
    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "content",
      action: "delete",
      entityType: "post",
      entityId: String(id),
      entityLabel: postResult.rows[0]?.title || String(id),
      message: "Deleted content post.",
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
