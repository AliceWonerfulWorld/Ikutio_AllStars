import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_TEMP_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_TEMP_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_TEMP_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { file, fileName } = data;
  console.log("[UPLOAD API] 受信データ:", { fileName, fileSize: file?.length });
  if (!file || !fileName) {
    console.log("[UPLOAD API] fileまたはfileNameが未指定");
    return NextResponse.json(
      { error: "file and fileName required" },
      { status: 400 }
    );
  }
  try {
    const buffer = Buffer.from(file, "base64");
    console.log("[UPLOAD API] Buffer作成完了", { bufferLength: buffer.length });
    const command = new PutObjectCommand({
      Bucket: process.env.R2_TEMP_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "image/jpeg",
    });
    console.log("[UPLOAD API] PutObjectCommand作成", { fileName });
    await s3.send(command);
    console.log("[UPLOAD API] R2アップロード完了", { fileName });
    // 画像URLを生成（R2の公開URL形式）
    const endpoint = process.env.R2_TEMP_ENDPOINT;
    const bucket = process.env.R2_TEMP_BUCKET_NAME;
    // 末尾のスラッシュを除去
    const endpointUrl = endpoint?.endsWith("/")
      ? endpoint.slice(0, -1)
      : endpoint;
    const imageUrl = `${endpointUrl}/${bucket}/${fileName}`;
    return NextResponse.json({ message: "Uploaded", imageUrl });
  } catch (e) {
    console.log("[UPLOAD API] エラー", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
