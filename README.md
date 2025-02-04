# AppSync Lambda Authorizer Cache Test

This project demonstrates a potential caching issue with AWS AppSync Lambda Authorizer. The issue manifests when making multiple API calls with the same authorization token.

## Issue Description

The test case in `test/api.test.ts` demonstrates the following behavior:

1. A test user authenticates through Cognito User Pool
2. The obtained identity token is used as a Bearer token for the Lambda authorizer
3. Two identical API calls are made with the same token
4. Both calls trigger the Lambda authorizer (visible in CloudWatch logs)
5. Expected behavior: Only the first call should trigger the authorizer, subsequent calls should use cached results

This behavior suggests that the AppSync Lambda authorizer's caching mechanism might not be working as expected, even when:
- Using the same API endpoint
- Using identical authorization tokens
- Making calls within the cache TTL period

![Logs from a cache miss](/assets/log-image.png)

## Architecture

- **AppSync API**: GraphQL API with Lambda Authorization
- **Cognito User Pool**: Handles user authentication
- **Lambda Authorizer**: Custom authorization logic with logging for verification
- **CDK Infrastructure**: Automated deployment of all components

## Prerequisites

- [Node.js](https://nodejs.org/) v22.13.1 (managed via Volta)
- AWS Account
- AWS credentials configured (see [AWS Credentials Setup](#aws-credentials-setup))

## AWS Credentials Setup

This project requires AWS credentials for deployment and testing. You can set up your credentials in one of the following ways:

1. **AWS CLI Configuration** (Recommended):
   ```bash
   aws configure
   ```
   This will create/update your `~/.aws/credentials` file.

2. **Environment Variables**:
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   ```

3. **AWS SSO**:
   ```bash
   aws sso login --profile your-sso-profile
   export AWS_PROFILE=your-sso-profile
   ```

The project will automatically use credentials from any of these sources in the following order:
1. Environment variables
2. AWS SSO
3. AWS credentials file

⚠️ **Security Note**: Never commit AWS credentials to version control. The project's `.gitignore` is configured to ignore `.env` files, but be careful with any other files containing sensitive information.

## Project Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd appsync-auth-cache-test
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. **Important**: Edit the `.env` file with your AWS account details before running any deployment or tests:
```
# AWS Account Configuration
CDK_DEFAULT_ACCOUNT=your-aws-account-id    # Required for deployment

# API Configuration
API_URL=your-api-url-after-deployment      # Required for tests (you'll get this after deployment)

# Optional AWS Credential Override
AWS_PROFILE=your-aws-profile               # Optional: Override AWS profile
AWS_ACCESS_KEY_ID=your-access-key          # Optional: Override AWS access key
AWS_SECRET_ACCESS_KEY=your-secret-key      # Optional: Override AWS secret key
```

⚠️ **Note**: The deployment will fail if `CDK_DEFAULT_ACCOUNT` is not properly configured in your `.env` file.
Similarly, tests will fail if `API_URL` is not set after deployment.

## Project Structure

- `src/lambda/authorizer.ts` - Lambda authorizer implementation
- `lib/appsync-auth-stack.ts` - CDK stack defining the AppSync API and Lambda authorizer
- `schema.graphql` - AppSync API schema
- `test/api.test.ts` - Integration tests
- `bin/app.ts` - CDK app entry point

## Deployment

1. Ensure your `.env` file is properly configured with `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`.

2. Bootstrap CDK (if you haven't already):
```bash
npm run bootstrap
```

1. Deploy the stack:

```bash
npm run deploy
```

1. After deployment, copy the GraphQL API URL from the CloudFormation outputs and update your `.env` file:
```
API_URL=https://xxxxx.appsync-api.region.amazonaws.com/graphql
```

## Running Tests

Before running tests, make sure:
1. The stack has been deployed successfully
2. You've updated the `.env` file with the correct `API_URL` from the deployment output

Then run the tests:
```bash
npm test
```

## Test Details

The test suite:
1. Makes an initial call to the AppSync API with a Bearer token
2. Makes a second call immediately after with the same token
3. Verifies that both calls succeed and return the expected response

This helps verify that:
- The Lambda authorizer is working correctly
- The authorization result is being cached appropriately between calls

## Development

- The project uses TypeScript for type safety
- AWS CDK is used for infrastructure as code
- Jest is used for testing
- Environment variables are managed via dotenv
- AWS credentials are handled through standard AWS credential providers

## Available Scripts

- `npm run deploy` - Deploy the CDK stack
- `npm run bootstrap` - Bootstrap CDK in your AWS account
- `npm run cdk -- <command>` - Run any CDK command
- `npm test` - Run the test suite

## Cleaning Up

To avoid incurring charges, remember to destroy the stack when you're done:
```bash
npm run cdk -- destroy
```

## Authentication

- Custom authorization logic in `src/lambda/authorizer.ts`
- Authorization caching (5-minute TTL)
- Bearer token support
  - The token takes the form of `Bearer <user-pool-identity-token>`

### User Pool

A Cognito User Pool is automatically created with the following configuration:
- Email-based sign-in
- Standard password policy
- Self-signup enabled
- A test user is automatically created during deployment

Test user credentials are managed through environment variables:
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD='Test123!@#'
```

The stack outputs include:
- User Pool ID
- User Pool Client ID
- Test user credentials


## Environment Variables

Required variables in `.env`:

```env
# AWS Configuration
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=eu-north-1

# API Configuration (set after deployment)
API_URL=your-api-url
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-client-id

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD='Test123!@#'
```

## License

MIT License - See LICENSE file for details
