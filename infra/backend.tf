# O estado fica num bucket S3 criado pelo pipeline (passo "Bootstrap do backend").
# Bucket, chave e região são passados no `terraform init` com -backend-config.
terraform {
  backend "s3" {}
}
