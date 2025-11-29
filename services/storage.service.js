const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: process.env.S3_REGION });

async function uploadEvidenceToStorage(file) {
  // file: multer file object
  const key = `sos/${Date.now()}_${file.originalname}`;
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "private"
  }).promise();
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

module.exports = { uploadEvidenceToStorage };
