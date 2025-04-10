module "dfs-tx-info" {

  source = "git@github.com:defisaver/ecs-terraform-module?ref=main"

  environment                      = "prod"
  cluster_id                       = data.terraform_remote_state.ecs_state.outputs.web_services[0].arn
  security_group_ingress_cidr_list = [local.stage_subnet_cidr[1], local.stage_subnet_cidr[0]]
  load_balancer_target_arn         = data.terraform_remote_state.general_infra.outputs.alb_fork_target_group_arn
  load_balancer_security_group_id  = data.terraform_remote_state.general_infra.outputs.alb_security_group_id
  service_name                     = "fork"
  repository                       = "defisaver-forkor"
  subnet_ids                       = [data.terraform_remote_state.general_infra.outputs.stage_subnets.ids[0], data.terraform_remote_state.general_infra.outputs.stage_subnets.ids[3]]
  vpc_id                           = data.terraform_remote_state.general_infra.outputs.automation_stage_vpc.id
  datadog_enabled                  = false
  datadog_monitoring_secret_arn    = data.terraform_remote_state.general_infra.outputs.datadog_api_key_arn
  datadog_agent_version            = "7.42.2"
  datadog_team_tag                 = "front"

  port_mappings = [
    {
      containerPort = 80
      hostPort      = 80
      protocol      = "tcp"
    }
  ]

  service_cpu    = 256
  service_memory = 512

  desired_count = 1

  deployment_image_tag = var.deployment_image_tag
}

