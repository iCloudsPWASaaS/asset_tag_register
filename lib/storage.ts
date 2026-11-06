import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/env";
import { formatTag, nextTagNumberFromTags, parseTagNumber } from "@/lib/tags";
import type {
  Asset,
  AssetInput,
  AssetStatus,
  AssetSummary,
  Premises,
  PremisesInput,
  UserIndex,
} from "@/lib/types";

const ROOT = "asset-register";
const INDEX_PREFIX = `${ROOT}/index`;
const ASSET_PREFIX = `${ROOT}/assets`;
const PREMISES_PREFIX = `${ROOT}/premises`;
const PHOTO_PREFIX = `${ROOT}/photos`;

const chains = new Map<string, Promise<unknown>>();
const indexCache = new Map<string, UserIndex>();

function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const previous = chains.get(userId) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  chains.set(userId, run.catch(() => undefined));
  return run;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function indexPath(userId: string) {
  return `${INDEX_PREFIX}/${userId}.json`;
}

function assetPath(userId: string, assetId: string) {
  return `${ASSET_PREFIX}/${userId}/${assetId}.json`;
}

function premisesPath(userId: string, premisesId: string) {
  return `${PREMISES_PREFIX}/${userId}/${premisesId}.json`;
}

async function uploadJson(path: string, data: unknown) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, Buffer.from(JSON.stringify(data, null, 2)), {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });
  if (error) throw new Error(`Storage write failed: ${error.message}`);
}

async function downloadJson<T>(path: string): Promise<T | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function listJsonFiles(prefix: string) {
  const admin = getSupabaseAdmin();
  const files: string[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await admin.storage.from(STORAGE_BUCKET).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Storage list failed: ${error.message}`);
    const entries = (data ?? []).filter((entry: { name: string }) =>
      entry.name.endsWith(".json"),
    );
    files.push(...entries.map((entry: { name: string }) => entry.name));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  return files;
}

function emptyIndex(userId: string): UserIndex {
  return {
    version: 1,
    userId,
    nextTagNumber: 1,
    assets: [],
    premises: [],
    updatedAt: new Date().toISOString(),
  };
}

function isIndex(value: unknown): value is UserIndex {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserIndex>;
  return (
    candidate.version === 1 &&
    typeof candidate.userId === "string" &&
    Array.isArray(candidate.assets) &&
    Array.isArray(candidate.premises)
  );
}

export function toAssetSummary(asset: Asset): AssetSummary {
  return {
    id: asset.id,
    tag: asset.tag,
    premisesId: asset.premisesId,
    premisesName: asset.premisesName,
    location: asset.location,
    type: asset.type,
    make: asset.make,
    model: asset.model,
    serialNumber: asset.serialNumber,
    status: asset.status,
    photoPath: asset.photoPath,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    manualStatus: asset.manual?.status || "none",
  };
}

export async function rebuildIndex(userId: string): Promise<UserIndex> {
  const [assetFiles, premisesFiles] = await Promise.all([
    listJsonFiles(`${ASSET_PREFIX}/${userId}`),
    listJsonFiles(`${PREMISES_PREFIX}/${userId}`),
  ]);

  const assets = (
    await mapLimit(assetFiles, 8, (name) =>
      downloadJson<Asset>(`${ASSET_PREFIX}/${userId}/${name}`),
    )
  ).filter((asset): asset is Asset => Boolean(asset));

  const premises = (
    await mapLimit(premisesFiles, 8, (name) =>
      downloadJson<Premises>(`${PREMISES_PREFIX}/${userId}/${name}`),
    )
  ).filter((item): item is Premises => Boolean(item));

  assets.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  premises.sort((a, b) => a.name.localeCompare(b.name));

  const index: UserIndex = {
    version: 1,
    userId,
    nextTagNumber: nextTagNumberFromTags(assets.map((asset) => asset.tag)),
    assets: assets.map(toAssetSummary),
    premises,
    updatedAt: new Date().toISOString(),
  };
  indexCache.set(userId, index);
  await uploadJson(indexPath(userId), index);
  return index;
}

export async function getIndex(userId: string): Promise<UserIndex> {
  const cached = indexCache.get(userId);
  if (cached) return cached;

  const stored = await downloadJson<unknown>(indexPath(userId));
  if (isIndex(stored)) {
    indexCache.set(userId, stored);
    return stored;
  }
  return rebuildIndex(userId);
}

export async function saveIndex(index: UserIndex) {
  index.updatedAt = new Date().toISOString();
  indexCache.set(index.userId, index);
  await uploadJson(indexPath(index.userId), index);
}

export async function listAssets(userId: string) {
  return (await getIndex(userId)).assets;
}

export async function getAsset(userId: string, assetId: string) {
  return downloadJson<Asset>(assetPath(userId, assetId));
}

export async function listPremises(userId: string) {
  return (await getIndex(userId)).premises;
}

export async function getPremises(userId: string, premisesId: string) {
  return downloadJson<Premises>(premisesPath(userId, premisesId));
}

function normaliseStatus(status: AssetStatus | undefined): AssetStatus {
  return status === "archived" || status === "removed" ? status : "active";
}

function emptyToNull(value: string | undefined | null) {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

async function createPremisesInternal(
  userId: string,
  input: PremisesInput,
  index: UserIndex,
): Promise<Premises> {
  const now = new Date().toISOString();
  const premises: Premises = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    addressLine1: (input.addressLine1 || "").trim(),
    addressLine2: (input.addressLine2 || "").trim(),
    addressLine3: (input.addressLine3 || "").trim(),
    postcode: (input.postcode || "").trim(),
    placeId: input.placeId?.trim() || undefined,
    notes: (input.notes || "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  await uploadJson(premisesPath(userId, premises.id), premises);
  index.premises.push(premises);
  index.premises.sort((a, b) => a.name.localeCompare(b.name));
  return premises;
}

function addressFromPremises(premises: Premises) {
  return [premises.addressLine1, premises.addressLine2, premises.addressLine3, premises.postcode]
    .filter(Boolean)
    .join(", ");
}

export async function createAsset(userId: string, input: AssetInput): Promise<Asset> {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);

    let premises: Premises | null = null;
    if (input.premisesId) {
      premises = await getPremises(userId, input.premisesId);
    }
    if (!premises) {
      premises = await createPremisesInternal(
        userId,
        {
          name: input.premisesName || "Unnamed premises",
          addressLine1: input.premisesAddress || "",
        },
        index,
      );
    }

    const now = new Date().toISOString();
    const asset: Asset = {
      id: crypto.randomUUID(),
      userId,
      tag: formatTag(index.nextTagNumber),
      premisesId: premises.id,
      premisesName: premises.name,
      premisesAddress: addressFromPremises(premises),
      location: (input.location || "").trim(),
      type: (input.type || "").trim(),
      make: (input.make || "").trim(),
      model: (input.model || "").trim(),
      serialNumber: (input.serialNumber || "").trim(),
      status: normaliseStatus(input.status),
      photoPath: input.photoPath || "",
      photoContentType: input.photoContentType || "",
      notes: (input.notes || "").trim(),
      engineer: (input.engineer || "").trim(),
      installedAt: input.installedAt || "",
      manual: null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      aiExtracted: Boolean(input.aiExtracted),
    };

    await uploadJson(assetPath(userId, asset.id), asset);
    index.nextTagNumber = Math.max(index.nextTagNumber + 1, parseTagNumber(asset.tag) + 1);
    index.assets.unshift(toAssetSummary(asset));
    await saveIndex(index);
    return asset;
  });
}

export async function updateAsset(
  userId: string,
  assetId: string,
  input: Partial<AssetInput> & { manual?: Asset["manual"] },
): Promise<Asset> {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);
    const existing = await getAsset(userId, assetId);
    if (!existing) throw new Error("Asset not found");

    let premisesName = existing.premisesName;
    let premisesAddress = existing.premisesAddress;
    let premisesId = existing.premisesId;

    if (input.premisesId && input.premisesId !== existing.premisesId) {
      const premises = await getPremises(userId, input.premisesId);
      if (premises) {
        premisesId = premises.id;
        premisesName = premises.name;
        premisesAddress = addressFromPremises(premises);
      }
    } else if (!input.premisesId && input.premisesName) {
      premisesName = input.premisesName.trim();
      if (input.premisesAddress !== undefined) premisesAddress = input.premisesAddress;
    }

    const updated: Asset = {
      ...existing,
      premisesId,
      premisesName,
      premisesAddress,
      location: input.location !== undefined ? input.location.trim() : existing.location,
      type: input.type !== undefined ? input.type.trim() : existing.type,
      make: input.make !== undefined ? input.make.trim() : existing.make,
      model: input.model !== undefined ? input.model.trim() : existing.model,
      serialNumber:
        input.serialNumber !== undefined ? input.serialNumber.trim() : existing.serialNumber,
      status: input.status ? normaliseStatus(input.status) : existing.status,
      photoPath: input.photoPath !== undefined ? input.photoPath : existing.photoPath,
      photoContentType:
        input.photoContentType !== undefined
          ? input.photoContentType
          : existing.photoContentType,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      engineer: input.engineer !== undefined ? input.engineer.trim() : existing.engineer,
      installedAt: input.installedAt !== undefined ? input.installedAt : existing.installedAt,
      aiExtracted:
        input.aiExtracted !== undefined ? Boolean(input.aiExtracted) : existing.aiExtracted,
      manual: input.manual !== undefined ? input.manual : existing.manual,
      updatedAt: new Date().toISOString(),
    };

    await uploadJson(assetPath(userId, assetId), updated);
    const summary = toAssetSummary(updated);
    const summaryIndex = index.assets.findIndex((asset) => asset.id === assetId);
    if (summaryIndex >= 0) index.assets[summaryIndex] = summary;
    else index.assets.unshift(summary);
    await saveIndex(index);
    return updated;
  });
}

export async function deleteAsset(userId: string, assetId: string) {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);
    const existing = await getAsset(userId, assetId);
    const paths = [assetPath(userId, assetId)];
    if (existing?.photoPath) paths.push(existing.photoPath);

    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from(STORAGE_BUCKET).remove(paths);
    if (error) throw new Error(`Storage delete failed: ${error.message}`);

    index.assets = index.assets.filter((asset) => asset.id !== assetId);
    await saveIndex(index);
  });
}

export async function createPremises(userId: string, input: PremisesInput): Promise<Premises> {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);
    if (input.placeId) {
      const existing = index.premises.find((premises) => premises.placeId === input.placeId);
      if (existing) return existing;
    }
    const premises = await createPremisesInternal(userId, input, index);
    await saveIndex(index);
    return premises;
  });
}

export async function updatePremises(
  userId: string,
  premisesId: string,
  input: PremisesInput,
): Promise<Premises> {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);
    const existing = await getPremises(userId, premisesId);
    if (!existing) throw new Error("Premises not found");

    const updated: Premises = {
      ...existing,
      name: input.name.trim(),
      addressLine1: (input.addressLine1 || "").trim(),
      addressLine2: (input.addressLine2 || "").trim(),
      addressLine3: (input.addressLine3 || "").trim(),
      postcode: (input.postcode || "").trim(),
      placeId: input.placeId?.trim() || existing.placeId,
      notes: (input.notes || "").trim(),
      updatedAt: new Date().toISOString(),
    };

    await uploadJson(premisesPath(userId, premisesId), updated);

    const indexEntry = index.premises.find((premises) => premises.id === premisesId);
    if (indexEntry) Object.assign(indexEntry, updated);
    else index.premises.push(updated);
    index.premises.sort((a, b) => a.name.localeCompare(b.name));

    const linked = index.assets.filter((asset) => asset.premisesId === premisesId);
    await mapLimit(linked, 6, async (summary) => {
      const asset = await getAsset(userId, summary.id);
      if (!asset) return;
      const next: Asset = {
        ...asset,
        premisesName: updated.name,
        premisesAddress: addressFromPremises(updated),
        updatedAt: new Date().toISOString(),
      };
      await uploadJson(assetPath(userId, asset.id), next);
      const target = index.assets.find((item) => item.id === asset.id);
      if (target) {
        target.premisesName = next.premisesName;
        target.updatedAt = next.updatedAt;
      }
    });

    await saveIndex(index);
    return updated;
  });
}

export async function deletePremises(userId: string, premisesId: string) {
  return withUserLock(userId, async () => {
    const index = await getIndex(userId);
    const linked = index.assets.filter((asset) => asset.premisesId === premisesId);
    if (linked.length > 0) {
      throw new Error(
        `This premises has ${linked.length} asset${linked.length === 1 ? "" : "s"}. Reassign or delete them first.`,
      );
    }
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .remove([premisesPath(userId, premisesId)]);
    if (error) throw new Error(`Storage delete failed: ${error.message}`);
    index.premises = index.premises.filter((premises) => premises.id !== premisesId);
    await saveIndex(index);
  });
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function uploadPhoto(userId: string, file: File) {
  if (!file.size) throw new Error("The photo is empty.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Photos must be smaller than 12 MB.");
  const contentType = file.type || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("Only image files are supported.");
  const extension = MIME_EXTENSIONS[contentType] || "jpg";
  const path = `${PHOTO_PREFIX}/${userId}/${crypto.randomUUID()}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return { path, contentType };
}

export async function downloadPhoto(path: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) return null;
  return data;
}

export function isPhotoOwnedByUser(path: string, userId: string) {
  return path.startsWith(`${PHOTO_PREFIX}/${userId}/`);
}

export async function getPublicAsset(userId: string, assetId: string) {
  const asset = await getAsset(userId, assetId);
  if (!asset) return null;
  const premises = asset.premisesId ? await getPremises(userId, asset.premisesId) : null;
  return { asset, premises };
}

export async function listIndexUserIds() {
  return listJsonFiles(INDEX_PREFIX).then((files) =>
    files.map((name) => name.replace(/\.json$/, "")),
  );
}

export async function getUserAssetCount(userId: string) {
  const index = await getIndex(userId);
  return index.assets.length;
}

export function assetAddress(asset: Asset) {
  return asset.premisesAddress || "";
}

export function statusLabel(status: AssetStatus) {
  if (status === "archived") return "Archived";
  if (status === "removed") return "Removed";
  return "Active";
}
