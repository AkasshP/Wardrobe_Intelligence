output "frontend_url" {
  description = "CloudFront frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "backend_url" {
  description = "API Gateway backend URL"
  value       = aws_apigatewayv2_api.backend.api_endpoint
}

output "s3_images_bucket" {
  description = "S3 bucket for wardrobe images"
  value       = aws_s3_bucket.images.id
}

output "s3_frontend_bucket" {
  description = "S3 bucket for frontend static files"
  value       = aws_s3_bucket.frontend.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend Docker image"
  value       = aws_ecr_repository.backend.repository_url
}
