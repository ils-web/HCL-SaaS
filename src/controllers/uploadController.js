const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret',
  },
  // If you use Cloudflare R2 or MinIO, specify the endpoint here:
  // endpoint: process.env.S3_ENDPOINT 
});

exports.getPresignedUrl = async (req, res) => {
  try {
    const { fileType } = req.body;
    
    if (!fileType) {
      return res.status(400).json({ error: 'fileType is required (e.g. image/jpeg)' });
    }

    const fileExtension = fileType.split('/')[1] || 'jpg';
    const fileName = `${req.tenantId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'hcl-saas-photos',
      Key: fileName,
      ContentType: fileType,
    });

    // URL is valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    res.json({
      uploadUrl,
      // The final URL where the image will be accessible after successful upload
      photoUrl: `https://${process.env.S3_BUCKET_NAME || 'hcl-saas-photos'}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${fileName}`
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
