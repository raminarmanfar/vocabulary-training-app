# S3 bucket for temporary vocabulary sharing via QR code
resource "aws_s3_bucket" "vocab_share" {
  bucket = "${var.project_name}-vocab-share"

  tags = {
    Project = var.project_name
    Purpose = "Temporary vocabulary sharing via QR code"
  }
}

# Block all public access — Lambda accesses it via IAM, never publicly
resource "aws_s3_bucket_public_access_block" "vocab_share" {
  bucket = aws_s3_bucket.vocab_share.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Auto-delete share objects after 1 day as a fallback safety net
resource "aws_s3_bucket_lifecycle_configuration" "vocab_share" {
  bucket = aws_s3_bucket.vocab_share.id

  rule {
    id     = "expire-shares"
    status = "Enabled"

    filter {
      prefix = "shares/"
    }

    expiration {
      days = 1
    }
  }
}
