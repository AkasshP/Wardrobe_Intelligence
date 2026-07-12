# DynamoDB Tables — Always Free (25GB, 25 RCU, 25 WCU)

resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  global_secondary_index {
    name            = "id-index"
    hash_key        = "id"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  tags = { Project = var.project_name }
}

resource "aws_dynamodb_table" "products" {
  name         = "${var.project_name}-products"
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key     = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "gender"
    type = "S"
  }

  attribute {
    name = "article_type"
    type = "S"
  }

  global_secondary_index {
    name            = "gender-index"
    hash_key        = "gender"
    range_key       = "article_type"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  tags = { Project = var.project_name }
}

resource "aws_dynamodb_table" "user_items" {
  name         = "${var.project_name}-user-items"
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = { Project = var.project_name }
}

resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-orders"
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key     = "user_id"
  range_key    = "sk"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = { Project = var.project_name }
}
