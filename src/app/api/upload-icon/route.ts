import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// R2の設定
const R2_BUCKET = "your-r2-bucket";
const R2_ENDPOINT = "https://your-r2-endpoint";
const R2_ACCESS_KEY_ID = "your-access-key";
const R2_SECRET_ACCESS_KEY = "your-secret-key";

// POSTのみ対応
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;
  if (!file || !userId) {
    return NextResponse.json(
      { error: "file or userId missing" },
      { status: 400 }
    );
  }
  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `icon_${userId}_${Date.now()}.${fileExt}`;

  // R2クライアント
  const s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // ファイルアップロード
  const arrayBuffer = await file.arrayBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      ACL: "public-read",
    })
  );

  // パブリックURL生成
  const url = `${R2_ENDPOINT}/${R2_BUCKET}/${fileName}`;
  return NextResponse.json({ url });
}
