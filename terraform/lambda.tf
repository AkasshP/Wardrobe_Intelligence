# IAM role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# S3 + DynamoDB access policy for Lambda
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project_name}-lambda-s3-dynamo"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.images.arn,
          "${aws_s3_bucket.images.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          aws_dynamodb_table.products.arn,
          "${aws_dynamodb_table.products.arn}/index/*",
          aws_dynamodb_table.user_items.arn,
          aws_dynamodb_table.orders.arn,
        ]
      }
    ]
  })
}

# Lambda function (uses Docker image from ECR)
resource "aws_lambda_function" "backend" {
  function_name = "${var.project_name}-backend"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:latest"
  timeout       = 300
  memory_size   = 1024

  environment {
    variables = {
      PROJECT_NAME           = var.project_name
      JWT_SECRET             = var.jwt_secret
      STRIPE_SECRET_KEY      = var.stripe_secret_key
      STRIPE_PUBLISHABLE_KEY = var.stripe_publishable_key
      S3_BUCKET_NAME         = aws_s3_bucket.images.id
      S3_REGION              = var.aws_region
      AWS_REGION_NAME        = var.aws_region
      REPLICATE_API_TOKEN    = var.replicate_api_token
    }
  }

  tags = {
    Name    = "${var.project_name}-backend"
    Project = var.project_name
  }

  depends_on = [aws_ecr_repository.backend]

  lifecycle {
    ignore_changes = [image_uri]
  }
}

# Lambda Function URL
resource "aws_lambda_function_url" "backend" {
  function_name      = aws_lambda_function.backend.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
    max_age       = 3600
  }
}
