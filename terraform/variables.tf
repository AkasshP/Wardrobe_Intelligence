variable "aws_region" {
  description = "AWS region"
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  default     = "wardrobe-intelligence"
}

variable "db_username" {
  description = "PostgreSQL master username"
  default     = "wardrobe_admin"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for backend auth"
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  sensitive   = true
}

variable "replicate_api_token" {
  description = "Replicate API token for virtual try-on"
  sensitive   = true
}
