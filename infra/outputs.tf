output "url_do_site" {
  description = "URL publica do site. Em HTTPS quando o CloudFront esta habilitado."
  value       = var.habilitar_cloudfront ? "https://${aws_cloudfront_distribution.site[0].domain_name}" : "http://${aws_instance.site.public_ip}"
}

output "url_da_origem" {
  description = "Endereco HTTP direto da EC2, sem CloudFront. O login nao funciona por aqui."
  value       = "http://${aws_instance.site.public_ip}"
}

output "ip_publico" {
  description = "IP publico da EC2."
  value       = aws_instance.site.public_ip
}

output "instance_id" {
  description = "Id da instancia, usado pelo workflow de deploy."
  value       = aws_instance.site.id
}

output "ecr_repository_url" {
  description = "URL do repositorio ECR."
  value       = aws_ecr_repository.app.repository_url
}

output "cloudfront_distribution_id" {
  description = "Id da distribuicao, usado pelo pipeline para limpar o cache apos o deploy. Vazio sem CloudFront."
  value       = var.habilitar_cloudfront ? aws_cloudfront_distribution.site[0].id : ""
}
