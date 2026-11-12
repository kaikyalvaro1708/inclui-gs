# CloudFront na frente da EC2: entrega o site em HTTPS no endereço *.cloudfront.net,
# sem precisar de domínio próprio nem certificado. Sem HTTPS, o navegador bloqueia o
# crypto.subtle e o login do Inclui+ não funciona.
#
# A EC2 continua servindo HTTP na porta 80; o CloudFront fala com ela por HTTP
# (origem) e com o visitante por HTTPS.

data "aws_cloudfront_cache_policy" "otimizado" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "${local.nome} - site do Inclui+"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"

  origin {
    origin_id   = "ec2"
    domain_name = aws_instance.site.public_dns

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "ec2"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    # Respeita o Cache-Control do nginx: HTML revalidado sempre, assets por 1 hora.
    cache_policy_id = data.aws_cloudfront_cache_policy.otimizado.id
  }

  # Página de erro do próprio site, com o status certo.
  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = { Name = "${local.nome}-cdn" }
}
