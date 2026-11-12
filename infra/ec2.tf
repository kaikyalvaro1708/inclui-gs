data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "site" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.publica.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  user_data_replace_on_change = true
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    regiao      = var.aws_region
    registry    = "${data.aws_caller_identity.atual.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    repositorio = aws_ecr_repository.app.repository_url
    container   = var.container_name
    porta       = var.container_port
  })

  # IMDSv2 obrigatorio: protege as credenciais da role contra SSRF.
  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  root_block_device {
    encrypted = true
  }

  tags = { Name = "${local.nome}-ec2" }
}
