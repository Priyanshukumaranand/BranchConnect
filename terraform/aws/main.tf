terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Example VPC for EKS
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "branchbase-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
}

# Example EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "branchbase-eks"
  cluster_version = "1.29"

  cluster_endpoint_public_access  = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = 1
      max_size     = 2
      desired_size = 1
      # NOTE: EKS Control Plane costs ~$0.10/hr (~$73/mo) and is NOT part of the free tier.
      # t3.small is the minimum viable size for K8s nodes (t3.micro will crash).
      instance_types = ["t3.small"]
    }
  }

  tags = {
    Environment = "Development"
    Terraform   = "true"
  }
}
