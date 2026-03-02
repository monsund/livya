import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config(); // IMPORTANT: load .env

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

async function testUpload() {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: "test.txt",
      Body: "hello s3",
    })
  );

  console.log("Uploaded test.txt");
}

testUpload().catch(console.error);
