import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

export type DynamoInventoryItem = {
  source_pk: string;
  source_sk?: string;
  sku: string;
  title: string;
  slug: string;
  category: string;
  collection: string;
  description: string;
  image_url: string;
  mrp: number;
  sale_price: number;
  quantity_available: number;
  raw: Record<string, unknown>;
};

type RawRecord = Record<string, unknown>;

function firstNonEmptyString(values: Array<string | number | undefined | null>, fallback = "") {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function stringValue(item: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function stringFromPaths(item: Record<string, unknown>, paths: string[], fallback = "") {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[part];
    }, item);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function numberValue(item: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function numberFromPaths(item: Record<string, unknown>, paths: string[], fallback = 0) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[part];
    }, item);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCollectionLabel(value: string) {
  return value.trim() || "General";
}

export function getDynamoTableName() {
  const tableName = process.env.DYNAMODB_TABLE_NAME || process.env.DYNAMO_DATA_TABLE;
  if (!tableName) throw new Error("DYNAMODB_TABLE_NAME (or DYNAMO_DATA_TABLE) is not configured");
  return tableName;
}

export function getDynamoClient() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error("AWS_REGION is not configured");

  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY ||
    process.env.AWS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_KEY ||
    process.env.AWS_ACCESS_SECRET;
  const rawSessionToken = process.env.AWS_SESSION_TOKEN;
  const endpoint = process.env.DYNAMODB_ENDPOINT;

  const hasStaticCreds = Boolean(accessKeyId && secretAccessKey);
  const shouldUseSessionToken = Boolean(rawSessionToken && accessKeyId?.startsWith("ASIA"));

  const client = new DynamoDBClient({
    region,
    endpoint: endpoint || undefined,
    credentials: hasStaticCreds
      ? {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
          sessionToken: shouldUseSessionToken ? rawSessionToken : undefined,
        }
      : undefined,
  });

  return DynamoDBDocumentClient.from(client);
}

function normalizeImageUrl(rawImage: string) {
  if (!rawImage) return "";
  if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) return rawImage;

  const cloudfrontDomain =
    process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ||
    process.env.CLOUDFRONT_DOMAIN ||
    "";
  const bucketName =
    process.env.AWS_S3_BUCKET_NAME ||
    process.env.NEXT_PUBLIC_AWS_S3_BUCKET ||
    "";
  const bucketRegion =
    process.env.NEXT_PUBLIC_AWS_S3_REGION ||
    process.env.AWS_REGION ||
    "ap-south-1";
  const prefix = process.env.AWS_S3_PATH_PREFIX || "";
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  const cleanKey = rawImage.replace(/^\/+/, "");
  const keyWithPrefix = cleanPrefix && !cleanKey.startsWith(cleanPrefix) ? `${cleanPrefix}/${cleanKey}` : cleanKey;

  if (cloudfrontDomain) {
    return `${cloudfrontDomain.replace(/\/+$/, "")}/${keyWithPrefix}`;
  }

  if (bucketName) {
    return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${keyWithPrefix}`;
  }

  return rawImage;
}

export function normalizeDynamoInventoryItem(item: Record<string, unknown>): DynamoInventoryItem {
  const sourcePk = firstNonEmptyString([
    stringValue(item, ["PK", "pk", "id", "productId", "product_id", "sku"]),
    stringFromPaths(item, ["keys.pk", "keys.PK"]),
  ]);
  const sourceSk = firstNonEmptyString([
    stringValue(item, ["SK", "sk", "sortKey", "variantId", "variant_id"], ""),
    stringFromPaths(item, ["keys.sk", "keys.SK"]),
  ]) || undefined;
  const sku = firstNonEmptyString([
    stringValue(item, ["sku", "SKU", "variant_sku", "item_code", "product_sku", "seller_sku"]),
    stringFromPaths(item, ["inventory.sku", "product.sku"]),
  ], sourcePk || sourceSk || "SKU");
  const title = firstNonEmptyString([
    stringValue(item, ["title", "name", "productName", "product_name", "item_name"]),
    stringFromPaths(item, ["product.title", "product.name"]),
  ], sku);
  const category = slugify(firstNonEmptyString([
    stringValue(item, ["category", "categorySlug", "category_slug", "type", "department"]),
    stringFromPaths(item, ["product.category", "category.slug"]),
  ], "uncategorized"));
  const mrp = numberFromPaths(item, ["pricing.mrp"], numberValue(item, ["mrp", "MRP", "price", "list_price", "max_retail_price"], 0));
  const salePrice = numberFromPaths(
    item,
    ["pricing.sale_price", "pricing.selling_price"],
    numberValue(item, ["sale_price", "salePrice", "selling_price", "sellingPrice", "sell_price", "sp", "price"], mrp),
  );
  const quantity = numberFromPaths(
    item,
    ["inventory.stock", "inventory.quantity", "inventory.available"],
    numberValue(item, ["quantity_available", "stock", "quantity", "inventory", "available", "current_stock", "on_hand"], 0),
  );
  const rawImage = firstNonEmptyString([
    stringValue(item, ["image_url", "imageUrl", "image", "thumbnail", "thumbnail_url", "image_key", "imageKey", "s3_key", "s3_image_key"]),
    stringFromPaths(item, ["media.image", "media.thumbnail", "images.0", "assets.primaryImage", "product.image"]),
  ]);

  return {
    source_pk: sourcePk || sku,
    source_sk: sourceSk || undefined,
    sku,
    title,
    slug: slugify(stringValue(item, ["slug"], title || sku)),
    category,
    collection: "General",
    description: stringValue(item, ["description", "short_description", "shortDescription"], `${title} from QuirkyHome inventory.`),
    image_url: normalizeImageUrl(rawImage),
    mrp,
    sale_price: salePrice || mrp,
    quantity_available: quantity,
    raw: item,
  };
}

function getPayload(item: RawRecord) {
  const payload = item.payload;
  return payload && typeof payload === "object" ? (payload as RawRecord) : null;
}

function getEntityType(item: RawRecord) {
  const value = item.entityType;
  return typeof value === "string" ? value : "";
}

function computeSalePrice(rate: number, discount: number, discountType: string) {
  if (!Number.isFinite(rate)) return 0;
  if (!Number.isFinite(discount) || discount <= 0) return rate;
  if (discountType === "percentage") return Math.max(0, Math.round((rate * (100 - discount) / 100) * 100) / 100);
  return Math.max(0, rate - discount);
}

function normalizeRateItem(parent: RawRecord, rateItem: RawRecord, index: number): DynamoInventoryItem | null {
  const sku = firstNonEmptyString([
    stringValue(rateItem, ["sku", "SKU", "product_sku", "item_code"]),
  ]);
  const title = firstNonEmptyString([
    stringValue(rateItem, ["productName", "name", "title"]),
  ], sku);

  if (!sku || !title) return null;

  const rate = numberValue(rateItem, ["rate", "price", "selling_price", "sale_price"], 0);
  const discount = numberValue(rateItem, ["discount"], 0);
  const discountType = stringValue(rateItem, ["discountType"], "amount").toLowerCase();
  const salePrice = computeSalePrice(rate, discount, discountType);
  const mrp = numberValue(rateItem, ["mrp", "MRP", "list_price"], rate || salePrice);
  const stock = numberValue(rateItem, ["stock", "quantity", "qty", "available"], 0);
  const rawImage = firstNonEmptyString([
    stringValue(rateItem, ["image", "image_url", "imageUrl", "s3_key", "image_key"]),
  ]);
  const sourcePk = firstNonEmptyString([
    stringValue(parent, ["timestamp_id", "id", "PK", "pk"]),
    stringValue(parent, ["partition"]),
  ], "RATE");

  return {
    source_pk: `${sourcePk}#${sku}#${index}`,
    source_sk: undefined,
    sku,
    title,
    slug: slugify(title),
    category: slugify(firstNonEmptyString([stringValue(rateItem, ["category", "department"])], "uncategorized")),
    collection: toCollectionLabel(firstNonEmptyString([stringValue(rateItem, ["collection", "group"])], "General")),
    description: `${title} from QuirkyHome inventory.`,
    image_url: normalizeImageUrl(rawImage),
    mrp: mrp || salePrice || rate,
    sale_price: salePrice || rate || mrp,
    quantity_available: stock,
    raw: {
      entityType: parent.entityType,
      partition: parent.partition,
      timestamp_id: parent.timestamp_id,
      payload: {
        id: getPayload(parent)?.id,
        partyName: getPayload(parent)?.partyName,
        rateItem,
      },
    },
  };
}

export function extractDynamoInventoryItems(item: RawRecord): DynamoInventoryItem[] {
  const payload = getPayload(item);
  const entityType = getEntityType(item).toLowerCase();

  if (entityType === "dataset_inventory" && payload) {
    const sku = firstNonEmptyString([stringValue(payload, ["sku", "barcodeSku", "itemSku"])]);
    const title = firstNonEmptyString([stringValue(payload, ["productName", "name", "title"])], sku);
    if (!sku || !title) return [];

    const price = numberValue(payload, ["price", "salePrice", "sellingPrice", "wholesalePrice"], 0);
    const mrp = numberValue(payload, ["mrp", "MRP", "listPrice"], price);
    const stock = numberValue(payload, ["stock", "availableStock", "quantity"], 0);
    const category = slugify(firstNonEmptyString([stringValue(payload, ["category", "department"])], "uncategorized"));
    const collection = toCollectionLabel(firstNonEmptyString([stringValue(payload, ["collection", "group"])], "General"));
    const image = firstNonEmptyString([
      stringValue(payload, ["imageUrl", "image", "thumbnail"]),
      Array.isArray(payload.imageUrls) && payload.imageUrls.length ? String(payload.imageUrls[0]) : "",
    ]);

    return [{
      source_pk: firstNonEmptyString([stringValue(item, ["timestamp_id", "id"])], `INV#${sku}`),
      source_sk: undefined,
      sku,
      title,
      slug: slugify(title),
      category,
      collection,
      description: stringValue(payload, ["description"], `${title} from QuirkyHome inventory.`),
      image_url: normalizeImageUrl(image),
      mrp: mrp || price,
      sale_price: price || mrp,
      quantity_available: stock,
      raw: item,
    }];
  }

  // Common ePanel pattern: party rate rows where products live inside payload.rates array.
  if (payload && Array.isArray(payload.rates)) {
    return payload.rates
      .map((rateItem, index) =>
        rateItem && typeof rateItem === "object"
          ? normalizeRateItem(item, rateItem as RawRecord, index)
          : null,
      )
      .filter((row): row is DynamoInventoryItem => Boolean(row));
  }

  // Skip known non-product dataset rows.
  if (
    entityType.includes("transporter") ||
    entityType.includes("party") ||
    entityType.includes("auth_") ||
    entityType.includes("lead") ||
    entityType.includes("inventoryadjustments")
  ) {
    return [];
  }

  // Fallback: if row itself carries product-ish fields.
  const normalized = normalizeDynamoInventoryItem(item);
  if (normalized.sku === "SKU" && normalized.title === "SKU" && normalized.mrp === 0 && normalized.sale_price === 0) {
    return [];
  }
  return [normalized];
}

export async function scanDynamoInventory(limit = 50) {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const result = await client.send(
    new ScanCommand({
      TableName: tableName,
      Limit: limit,
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "dataset_inventory",
      },
    }),
  );
  return (result.Items ?? []).flatMap((item) => extractDynamoInventoryItems(item as RawRecord));
}

function encodeCursor(lastEvaluatedKey?: Record<string, unknown>) {
  if (!lastEvaluatedKey) return null;
  return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString("base64");
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export async function scanDynamoInventoryPage(limit = 10, cursor?: string | null) {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const items: DynamoInventoryItem[] = [];
  let lastEvaluatedKey = decodeCursor(cursor);

  // Scan in chunks because table includes mixed entities; collect until we have product rows.
  while (items.length < limit) {
    const result = await client.send(
      new ScanCommand({
        TableName: tableName,
        Limit: Math.max(limit * 3, 30),
        ExclusiveStartKey: lastEvaluatedKey,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "dataset_inventory",
        },
      }),
    );

    const mapped = (result.Items ?? []).flatMap((item) => extractDynamoInventoryItems(item as RawRecord));
    items.push(...mapped);
    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;

    if (!lastEvaluatedKey) break;
  }

  return {
    items: items.slice(0, limit),
    nextCursor: encodeCursor(lastEvaluatedKey),
  };
}

export async function scanAllDynamoInventory(maxItems = 2000) {
  const client = getDynamoClient();
  const tableName = getDynamoTableName();
  const items: DynamoInventoryItem[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 200,
        FilterExpression: "entityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "dataset_inventory",
        },
      }),
    );

    items.push(...(result.Items ?? []).flatMap((item) => extractDynamoInventoryItems(item as RawRecord)));
    lastEvaluatedKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey && items.length < maxItems);

  return items.slice(0, maxItems);
}
