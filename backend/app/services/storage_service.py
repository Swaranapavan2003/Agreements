import asyncio
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            settings.storage_provider,
            endpoint_url=settings.storage_endpoint,
            aws_access_key_id=settings.storage_access_key,
            aws_secret_access_key=settings.storage_secret_key,
            region_name=settings.storage_region,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.storage_bucket
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket)
            except Exception as e:
                print(f"Error creating bucket: {e}")

    def _upload_file_sync(self, file_content: bytes, object_name: str, content_type: str) -> str:
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=object_name,
            Body=file_content,
            ContentType=content_type
        )
        return object_name

    async def upload_file(self, file_content: bytes, object_name: str, content_type: str) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._upload_file_sync, file_content, object_name, content_type)

    def _get_presigned_url_sync(self, object_name: str, expiration: int = 3600) -> str:
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            return ""

    async def get_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._get_presigned_url_sync, object_name, expiration)
