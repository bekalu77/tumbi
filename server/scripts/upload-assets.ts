import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error('Missing R2 environment variables');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const assetsDir = path.join(process.cwd(), 'r2-assets');

async function uploadFile(filePath: string) {
  const fileKey = path.relative(assetsDir, filePath).replace(/\\/g, '/');
  console.log(`Uploading ${fileKey}...`);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: fs.createReadStream(filePath),
        ContentType: getContentType(filePath),
      })
    );
    console.log(`Successfully uploaded ${fileKey}`);
  } catch (err) {
    console.error(`Failed to upload ${fileKey}:`, err);
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.md':
      return 'text/markdown';
    default:
      return 'application/octet-stream';
  }
}

async function uploadDirectory(directory: string) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      await uploadDirectory(fullPath);
    } else {
      await uploadFile(fullPath);
    }
  }
}

async function main() {
  console.log('Starting asset upload to R2...');
  await uploadDirectory(assetsDir);
  console.log('Asset upload completed.');
}

main().catch(console.error);
