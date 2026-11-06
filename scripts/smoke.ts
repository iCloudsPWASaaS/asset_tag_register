import "dotenv/config";
import dotenv from "dotenv";
import assert from "node:assert/strict";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });

async function main() {
  const { createAsset, listAssets, getAsset, updateAsset, deleteAsset, createPremises, deletePremises, getIndex, uploadPhoto, downloadPhoto } =
    await import("../lib/storage");
  const { getSupabaseAdmin } = await import("../lib/supabase/admin");
  const { STORAGE_BUCKET } = await import("../lib/env");
  const { generateManufacturerManual } = await import("../lib/ai");
  const { buildRegisterPdf } = await import("../lib/pdf");
  const { toCsv } = await import("../lib/csv");
  const QRCode = (await import("qrcode")).default;

  const userId = crypto.randomUUID();
  console.log("Test user", userId);

  try {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=",
      "base64",
    );
    const photo = await uploadPhoto(
      userId,
      new File([png], "label.png", { type: "image/png" }),
    );
    assert.ok(photo.path.includes(userId));
    const photoBlob = await downloadPhoto(photo.path);
    assert.ok(photoBlob);
    console.log("photo upload/download OK");

    const premises = await createPremises(userId, {
      name: "Subway UK, St Vincent Street Glasgow",
      addressLine1: "123 St Vincent Street",
      addressLine2: "Glasgow",
      postcode: "G2 5TF",
    });
    assert.ok(premises.id);
    console.log("premises create OK");

    const asset = await createAsset(userId, {
      premisesId: premises.id,
      premisesName: premises.name,
      location: "Entrance",
      type: "Fire safety sign",
      make: "Alpha",
      model: "Twin LED, 24V battery",
      serialNumber: "ABC1234",
      photoPath: photo.path,
      photoContentType: photo.contentType,
    });
    assert.equal(asset.tag, "AT-000001");
    assert.equal(asset.premisesName, premises.name);
    console.log("asset create OK", asset.tag);

    const listed = await listAssets(userId);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].serialNumber, "ABC1234");

    const fetched = await getAsset(userId, asset.id);
    assert.ok(fetched);

    const manual = await generateManufacturerManual({
      make: "Alpha",
      model: "Twin LED",
      type: "Fire safety sign",
    });
    assert.ok(manual.sources.length > 0);

    const updated = await updateAsset(userId, asset.id, {
      location: "Rear entrance",
      manual,
    });
    assert.equal(updated.location, "Rear entrance");
    assert.ok(updated.manual);
    console.log("asset update + fallback manual OK");

    const qr = await QRCode.toBuffer(
      `http://localhost:3000/a/${userId}/${asset.id}`,
      { type: "png", width: 600 },
    );
    assert.ok(qr.length > 1000);
    console.log("QR generation OK");

    const pdf = buildRegisterPdf({
      companyName: "Test Co",
      assets: [updated],
      generatedBy: "test@example.com",
    });
    assert.ok(pdf.length > 1000);
    console.log("PDF generation OK");

    const csv = toCsv([{ tag: updated.tag, premisesName: updated.premisesName }], [
      { key: "tag", label: "Tag" },
      { key: "premisesName", label: "Premises" },
    ]);
    assert.ok(csv.includes("AT-000001"));
    console.log("CSV generation OK");

    await deleteAsset(userId, asset.id);
    assert.equal((await listAssets(userId)).length, 0);
    await deletePremises(userId, premises.id);
    assert.equal((await getIndex(userId)).premises.length, 0);
    console.log("delete OK");

    const admin = getSupabaseAdmin();
    await admin.storage.from(STORAGE_BUCKET).remove([
      `asset-register/index/${userId}.json`,
    ]);
    console.log("SMOKE TEST PASSED");
  } catch (error) {
    console.error("SMOKE TEST FAILED", error);
    process.exitCode = 1;
  }
}

void main();
