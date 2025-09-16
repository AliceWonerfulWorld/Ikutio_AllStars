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
      ContentType: "image/png",
    });
    console.log("[UPLOAD API] PutObjectCommand作成", { fileName });
    const putResult = await s3.send(command);
    console.log("[UPLOAD API] R2アップロード完了", { fileName, putResult });
    // 画像URLを生成（R2のパブリックURL形式）
    const imageUrl = `https://pub-1d11d6a89cf341e7966602ec50afd166.r2.dev/${fileName}`;
    console.log("[UPLOAD API] 返却imageUrl", imageUrl);
    return NextResponse.json({ message: "Uploaded", imageUrl });
  } catch (e) {
    console.log("[UPLOAD API] エラー", e);
    if (e instanceof Error) {
      return NextResponse.json(
        { error: e.message, stack: e.stack },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
