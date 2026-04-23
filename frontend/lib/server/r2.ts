import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let r2: S3Client | null = null

function getR2(): S3Client {
  if (!r2) {
    const accountId = process.env.R2_ACCOUNT_ID
    if (!accountId) throw new Error('R2_ACCOUNT_ID is not set')
    r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    })
  }
  return r2
}

const BUCKET = () => {
  const b = process.env.R2_BUCKET_NAME
  if (!b) throw new Error('R2_BUCKET_NAME is not set')
  return b
}

const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await getR2().send(new PutObjectCommand({ Bucket: BUCKET(), Key: key, Body: body, ContentType: contentType }))
  return key
}

export async function deleteFromR2(key: string): Promise<void> {
  await getR2().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }))
}

export async function fileUrl(key: string): Promise<string> {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`
  return getSignedUrl(getR2(), new GetObjectCommand({ Bucket: BUCKET(), Key: key }), { expiresIn: 3600 })
}
