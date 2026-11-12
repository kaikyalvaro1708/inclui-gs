resource "aws_ecr_repository" "app" {
  name = local.nome
  # Imutável: cada imagem tem o SHA do commit como tag e nunca é sobrescrita.
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true

  tags = { Name = "${local.nome}-ecr" }
}

