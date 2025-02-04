#!/usr/bin/env ts-node
import * as dotenv from 'dotenv';
import { spawnSync } from 'child_process';

// Load environment variables from .env file
dotenv.config();

const { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } = process.env;

if (!CDK_DEFAULT_ACCOUNT || !CDK_DEFAULT_REGION) {
  console.error('Error: CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set in .env file');
  process.exit(1);
}

// Set AWS_REGION to ensure SDK uses the correct region
process.env.AWS_REGION = CDK_DEFAULT_REGION;

console.log(`Deploying to account ${CDK_DEFAULT_ACCOUNT} in region ${CDK_DEFAULT_REGION}`);

const result = spawnSync('cdk', ['deploy'], { 
  shell: true, 
  stdio: 'inherit',
  env: {
    ...process.env,
    AWS_REGION: CDK_DEFAULT_REGION,
    AWS_DEFAULT_REGION: CDK_DEFAULT_REGION
  }
});

process.exit(result.status || 0);
