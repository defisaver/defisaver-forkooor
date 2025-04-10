locals {
  common_tags = {
    "Team"       = "SRE"
    "Repository" = "defisaver/infrastructure"
  }

  common_tags_prod = {
    "Team"        = "SRE"
    "Repository"  = "defisaver/infrastructure"
    "Environment" = "prod"
  }

  stage_subnet_cidr = [for s in data.terraform_remote_state.general_infra.outputs.stage_subnet_list : s.cidr_block]
}