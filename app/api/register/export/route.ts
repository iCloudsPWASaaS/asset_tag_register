import { NextResponse } from "next/server";
import { getAccountContext } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { getAsset, listAssets, listPremises } from "@/lib/storage";
import { toCsv, type CsvColumn } from "@/lib/csv";
import { buildRegisterPdf } from "@/lib/pdf";
import { SUPABASE_SCHEMA } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import type { Asset } from "@/lib/types";

const columns: CsvColumn[] = [
  { key: "tag", label: "Asset tag" },
  { key: "premisesName", label: "Premises" },
  { key: "premisesAddress", label: "Premises address" },
  { key: "location", label: "Location" },
  { key: "type", label: "Asset type" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "serialNumber", label: "Serial number" },
  { key: "status", label: "Status" },
  { key: "installedAt", label: "Installed" },
  { key: "engineer", label: "Engineer" },
  { key: "manualStatus", label: "Manual guidance" },
  { key: "manualSummary", label: "Manual summary" },
  { key: "notes", label: "Notes" },
  { key: "publicUrl", label: "QR record URL" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
];

function exportRows(assets: Asset[], siteUrl: string) {
  return assets.map((asset) => ({
    ...asset,
    manualStatus: asset.manual
      ? asset.manual.status === "ai"
        ? "AI guidance"
        : "Search links"
      : "None",
    manualSummary: asset.manual?.summary || "",
    installedAt: asset.installedAt ? formatDate(asset.installedAt) : "",
    createdAt: formatDate(asset.createdAt),
    updatedAt: formatDate(asset.updatedAt),
    publicUrl: `${siteUrl}/a/${asset.userId}/${asset.id}`,
  }));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccountContext(user.id);
  if (!account.access.allowed) {
    return NextResponse.json({ error: "Your active plan is required." }, { status: 402 });
  }

  const params = new URL(request.url).searchParams;
  const format = params.get("format") || "csv";
  const premisesFilter = params.get("premises") || "";
  const typeFilter = params.get("type") || "";
  const statusFilter = params.get("status") || "";
  const query = (params.get("q") || "").trim().toLowerCase();

  const summaries = await listAssets(user.id);
  const [assets, premises] = await Promise.all([
    Promise.all(summaries.map((summary) => getAsset(user.id, summary.id))),
    listPremises(user.id),
  ]);
  let fullAssets = assets.filter((asset): asset is Asset => Boolean(asset));
  fullAssets = fullAssets.filter((asset) => {
    if (premisesFilter && asset.premisesId !== premisesFilter) return false;
    if (typeFilter && asset.type !== typeFilter) return false;
    if (statusFilter && asset.status !== statusFilter) return false;
    if (!query) return true;
    return [
      asset.tag,
      asset.premisesName,
      asset.location,
      asset.type,
      asset.make,
      asset.model,
      asset.serialNumber,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  fullAssets.sort((a, b) => a.tag.localeCompare(b.tag));

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const company = account.profile?.company_name || account.profile?.full_name || "AssetTag Register";
  const date = new Date().toISOString().slice(0, 10);
  const filenameBase = `asset-tag-register-${date}`;

  if (format === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      company,
      schema: SUPABASE_SCHEMA,
      premises,
      assets: fullAssets,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
      },
    });
  }

  if (format === "pdf") {
    const pdf = buildRegisterPdf({
      companyName: company,
      assets: fullAssets,
      generatedBy: user.email || "",
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  }

  const csv = toCsv(exportRows(fullAssets, siteUrl), columns);
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}
