resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.nome}-vpc" }
}

data "aws_availability_zones" "disponiveis" {
  state = "available"
}

# Pública por necessidade: a EC2 é a origem do CloudFront e precisa de internet para puxar
# a imagem do ECR e falar com o SSM. Sem NAT Gateway, que custaria mais que a própria EC2.
# O acesso é controlado pelo security group, que só libera a porta 80.
# nosemgrep: terraform.aws.security.aws-subnet-has-public-ip-address.aws-subnet-has-public-ip-address
resource "aws_subnet" "publica" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_cidr
  availability_zone       = data.aws_availability_zones.disponiveis.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${local.nome}-subnet-publica" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${local.nome}-igw" }
}

resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = { Name = "${local.nome}-rtb-publica" }
}

# Sem a associacao, a rota existe mas nao vale para a sub-rede, e a EC2 fica sem internet.
resource "aws_route_table_association" "publica" {
  subnet_id      = aws_subnet.publica.id
  route_table_id = aws_route_table.publica.id
}
