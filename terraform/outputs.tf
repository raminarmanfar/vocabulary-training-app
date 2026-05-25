output "api_url" {
  description = "Base URL of the HTTP API Gateway endpoint"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "generate_endpoint" {
  description = "Full URL for the POST /generate route"
  value       = "${trimsuffix(aws_apigatewayv2_stage.default.invoke_url, "/")}/generate"
}

output "api_key_ssm_path" {
  description = "SSM Parameter Store path where the API key is stored (SecureString)"
  value       = aws_ssm_parameter.api_key.name
}

output "api_key_value" {
  description = "Raw API key value — store this in your Angular environment file"
  value       = random_password.api_key.result
  sensitive   = true
}
