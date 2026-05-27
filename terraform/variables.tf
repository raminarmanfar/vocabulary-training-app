variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "vocab-trainer"
}

variable "bedrock_model_id" {
  description = "AWS Bedrock model ID to use for vocabulary generation"
  type        = string
  default     = "eu.anthropic.claude-3-haiku-20240307-v1:0"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}
