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

const bootstrapCommand = `cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}`;

console.log(`Bootstrapping CDK in account ${CDK_DEFAULT_ACCOUNT} and region ${CDK_DEFAULT_REGION}`);

const result = spawnSync(bootstrapCommand, { 
  shell: true, 
  stdio: 'inherit'
});

process.exit(result.status || 0);
