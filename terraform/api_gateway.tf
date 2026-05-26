# HTTP API (API Gateway v2) — simpler and cheaper than REST API v1
resource "aws_apigatewayv2_api" "vocab_ai" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  description   = "VocabTrainer AI vocabulary generation API"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["Content-Type", "x-api-key"]
    max_age       = 300
  }
}

# Lambda integration
resource "aws_apigatewayv2_integration" "vocab_ai" {
  api_id                 = aws_apigatewayv2_api.vocab_ai.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.vocab_ai.invoke_arn
  payload_format_version = "2.0"
}

# Auto-deployed default stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.vocab_ai.id
  name        = "$default"
  auto_deploy = true
}

# ── API Key via Lambda authorizer ─────────────────────────────────────────────
# Key is generated once, stored in SSM Parameter Store as a SecureString.

resource "random_password" "api_key" {
  length  = 40
  special = false
}

resource "aws_ssm_parameter" "api_key" {
  name  = "/${var.project_name}/api-key"
  type  = "SecureString"
  value = random_password.api_key.result
}

data "archive_file" "authorizer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/authorizer"
  output_path = "${path.module}/.build/authorizer.zip"
}

resource "aws_lambda_function" "authorizer" {
  function_name    = "${var.project_name}-authorizer"
  description      = "Simple API key authorizer for the vocab-ai API"
  filename         = data.archive_file.authorizer_zip.output_path
  source_code_hash = data.archive_file.authorizer_zip.output_base64sha256
  handler          = "authorizer.handler"
  runtime          = "python3.12"
  role             = aws_iam_role.lambda_exec.arn
  timeout          = 5
  memory_size      = 128

  environment {
    variables = {
      API_KEY_PARAM = aws_ssm_parameter.api_key.name
    }
  }
}

resource "aws_iam_role_policy" "authorizer_ssm" {
  name = "${var.project_name}-authorizer-ssm"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter"]
      Resource = aws_ssm_parameter.api_key.arn
    }]
  })
}

resource "aws_lambda_permission" "authorizer_api_gw" {
  statement_id  = "AllowAuthorizerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.vocab_ai.execution_arn}/*"
}

resource "aws_apigatewayv2_authorizer" "api_key" {
  api_id                            = aws_apigatewayv2_api.vocab_ai.id
  name                              = "api-key-authorizer"
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  identity_sources                  = ["$request.header.x-api-key"]
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  authorizer_result_ttl_in_seconds  = 300
}

# POST /generate — protected by the API key authorizer
resource "aws_apigatewayv2_route" "generate" {
  api_id             = aws_apigatewayv2_api.vocab_ai.id
  route_key          = "POST /generate"
  target             = "integrations/${aws_apigatewayv2_integration.vocab_ai.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
}

# POST /share — upload vocabs, protected by API key
resource "aws_apigatewayv2_route" "share_upload" {
  api_id             = aws_apigatewayv2_api.vocab_ai.id
  route_key          = "POST /share"
  target             = "integrations/${aws_apigatewayv2_integration.vocab_ai.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
}

# GET /share/{token} — download vocabs, public (token itself is the secret)
resource "aws_apigatewayv2_route" "share_download" {
  api_id    = aws_apigatewayv2_api.vocab_ai.id
  route_key = "GET /share/{token}"
  target    = "integrations/${aws_apigatewayv2_integration.vocab_ai.id}"
}

# POST /analyze-sentence — AI sentence analysis, protected by API key
resource "aws_apigatewayv2_route" "analyze_sentence" {
  api_id             = aws_apigatewayv2_api.vocab_ai.id
  route_key          = "POST /analyze-sentence"
  target             = "integrations/${aws_apigatewayv2_integration.vocab_ai.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key.id
}
