output "url_do_site" {
  description = "URL publica do site, em HTTPS pelo CloudFront."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
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
  description = "Id da distribuicao, usado pelo workflow para limpar o cache apos o deploy."
  value       = aws_cloudfront_distribution.site.id
}
