# Vocab Trainer – AWS Bedrock Infrastructure

This directory contains the Terraform configuration to deploy the AI vocabulary
generation backend on AWS.

## Architecture

```
Angular App
    │
    │  POST /generate  (x-api-key header)
    ▼
API Gateway v2 (HTTP API)
    │
    │  Lambda authorizer checks x-api-key vs SSM SecureString
    ▼
Lambda: vocab-ai (Python 3.12)
    │
    │  InvokeModel
    ▼
AWS Bedrock – Claude Sonnet 4
```

## Prerequisites

1. **AWS CLI** configured with credentials that can create IAM roles, Lambda, API Gateway, SSM, and call Bedrock.
2. **Terraform ≥ 1.5** installed (`terraform -version`).
3. **Bedrock model access** enabled in `eu-central-1`:
    - Go to AWS Console → Bedrock → Model access → Request `Claude Sonnet 4`.

## Deploy

```bash
cd terraform

# 1. Initialise providers
terraform init

# 2. Preview changes
terraform plan

# 3. Deploy
terraform apply
```

After apply, copy the outputs into your Angular environment files:

```bash
# Get the API endpoint URL
terraform output generate_endpoint

# Get the raw API key (sensitive — keep secret)
terraform output -raw api_key_value
```

Edit `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (prod):

```typescript
export const environment = {
  production: false,
  bedrockApiUrl: '<paste generate_endpoint>',
  bedrockApiKey: '<paste api_key_value>',
};
```

Then rebuild the app:

```bash
npm run build
npx cap sync android
```

## Destroy

```bash
terraform destroy
```

## Cost estimate (eu-central-1, light usage)

| Service                 | Est. monthly cost                                    |
| ----------------------- | ---------------------------------------------------- |
| API Gateway HTTP API    | ~$0.001 per 1 000 requests                           |
| Lambda invocations      | Free tier covers 1M req/month                        |
| Bedrock Claude Sonnet 4 | Higher quality than Haiku with higher per-token cost |
| SSM Parameter Store     | Free (standard tier)                                 |

Generating ~100 vocabulary entries/month ≈ **< $0.10 total**.
