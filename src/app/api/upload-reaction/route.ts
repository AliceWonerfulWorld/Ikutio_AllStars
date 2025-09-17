import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = process.env.R2_TEMP_BUCKET_NAME!;
const R2_ENDPOINT = process.env.R2_TEMP_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.R2_TEMP_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_TEMP_SECRET_ACCESS_KEY!;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const userId = form.get("userId") as string;
    if (!file || !userId) {
      return NextResponse.json(
        { error: "file and userId required" },
        { status: 400 }
      );
    }
    const now = new Date();
    const ymd = now
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const fileName = `${userId}_${ymd}.jpg`;
    const arrayBuffer = await file.arrayBuffer();
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: Buffer.from(arrayBuffer),
      ContentType: "image/jpeg",
      ACL: "public-read",
    });
    await s3.send(putCommand);
    // R2_ENDPOINTがcloudflarestorage.comの場合はpub-...r2.devに変換
    let publicUrl: string;
    if (R2_ENDPOINT.includes("cloudflarestorage.com")) {
      // 例: https://da1ba209d61b3c9fb6834468fb0bb4f4.r2.cloudflarestorage.com → https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev
      // pub-...部分はユーザーのR2公開設定に合わせてください
      publicUrl = `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${fileName}`;
    } else {
      publicUrl = `${R2_ENDPOINT}/${fileName}`;
    }
    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "upload failed" },
      { status: 500 }
    );
  }
}
