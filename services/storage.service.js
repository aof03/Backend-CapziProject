const AWS = require("aws-sdk");
const path = require("path");
const crypto = require("crypto");

const S3_REGION = process.env.S3_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const DEFAULT_PRESIGN_EXP = 60 * 60;

if (!S3_BUCKET || !S3_REGION) {
  console.warn("S3 config missing (S3_BUCKET / S3_REGION)");
}

const s3 = new AWS.S3({ region: S3_REGION });

/* ================================
   Safe filename
================================ */
function safeFilename(originalName) {
  const ext = path.extname(originalName || "");
  const base = path
    .basename(originalName || "", ext)
    .replace(/[^\w\-_.() ]+/g, "_")
    .slice(0, 100);

  const id = crypto.randomBytes(6).toString("hex");

  return `${Date.now()}_${id}_${base}${ext}`;
}

/* ================================
   Upload to S3
================================ */
async function uploadEvidenceToStorage(file, options = {}) {
  if (!file) throw new Error("No file provided");
  if (!file.buffer && !file.stream)
    throw new Error("File missing buffer/stream");

  if (!S3_BUCKET || !S3_REGION)
    throw new Error("S3 config missing");

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
    await s3.upload(params).promise();

    if (makePublic) {
      return {
        key,
        url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodeURIComponent(
          key
        )}`
      };
    }

    const url = await s3.getSignedUrlPromise("getObject", {
      Bucket: S3_BUCKET,
      Key: key,
      Expires: expiresIn
    });

    return { key, url };
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }
}

module.exports = { uploadEvidenceToStorage };