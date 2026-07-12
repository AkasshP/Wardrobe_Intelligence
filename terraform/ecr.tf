# ECR repository for backend Docker image
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name    = "${var.project_name}-backend"
    Project = var.project_name
  }
}
