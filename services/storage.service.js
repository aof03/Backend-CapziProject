const AWS = require("aws-sdk");
const path = require("path");
const crypto = require("crypto");

const S3_REGION = process.env.S3_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const DEFAULT_PRESIGN_EXP = 60 * 60; // 1 hour

if (!S3_BUCKET || !S3_REGION) {
  // don't throw on module load in some environments, but warn
  console.warn("S3_BUCKET or S3_REGION not set. storage.service may fail at runtime.");
}

const s3 = new AWS.S3({ region: S3_REGION });

function safeFilename(originalName) {
  const ext = path.extname(originalName || "");
  const base = path.basename(originalName || "", ext).replace(/[^\w\-_.() ]+/g, "_").slice(0, 100);
  const id = crypto.randomBytes(6).toString("hex");
  return `${Date.now()}_${id}_${base}${ext}`;
}

/**
 * Upload multer file object to S3.
 * Returns { key, bucket, region, url } where url is a presigned GET URL (expires configurable)
 *
 * options:
 *  - makePublic: boolean (if true, ACL 'public-read' will be applied and public url returned)
 *  - expiresIn: seconds for presigned url (default 3600)
 */
async function uploadEvidenceToStorage(file, options = {}) {
  if (!file) throw new Error("No file provided");
  if (!file.buffer && !file.stream) throw new Error("File missing buffer/stream");

  if (!S3_BUCKET || !S3_REGION) throw new Error("S3 configuration missing (S3_BUCKET / S3_REGION)");

  const { makePublic = false, expiresIn = DEFAULT_PRESIGN_EXP } = options;
  const filename = safeFilename(file.originalname || "upload.bin");
  const key = `sos/${filename}`;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer || file.stream,
    ContentType: file.mimetype || "application/octet-stream",
    ACL: makePublic ? "public-read" : "private",
    CacheControl: "private, max-age=0, no-cache"
  };

  try {
    // use upload() for multipart support and retry
    await s3.upload(params).promise();

    if (makePublic) {
      // public URL format (works for most regions and non-dot bucket names)
      const publicUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
      return { key, bucket: S3_BUCKET, region: S3_REGION, url: publicUrl };
    }

    // return presigned GET URL
    const presignedUrl = await new Promise((resolve, reject) => {
      s3.getSignedUrl("getObject", { Bucket: S3_BUCKET, Key: key, Expires: expiresIn }, (err, url) =>
        err ? reject(err) : resolve(url)
      );
    });

    return { key, bucket: S3_BUCKET, region: S3_REGION, url: presignedUrl };
  } catch (err) {
    // surface meaningful message
    const msg = err && err.message ? err.message : String(err);
    throw new Error(`S3 upload failed: ${msg}`);
  }
}

module.exports = { uploadEvidenceToStorage };

