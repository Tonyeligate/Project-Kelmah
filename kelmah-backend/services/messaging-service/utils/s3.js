const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

exports.getPresignedUploadUrl = async ({
  key,
  contentType,
  expiresIn = 300,
}) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
    ACL: "private",
  };
  return s3.getSignedUrlPromise("putObject", params);
};

exports.getPresignedDownloadUrl = async ({ key, expiresIn = 300 }) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: expiresIn,
    ResponseContentDisposition: "attachment",
  };
  return s3.getSignedUrlPromise("getObject", params);
};
