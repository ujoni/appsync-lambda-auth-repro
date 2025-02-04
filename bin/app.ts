#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppSyncAuthStack } from '../lib/appsync-auth-stack';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = new cdk.App();

new AppSyncAuthStack(app, 'AppSyncAuthStack-test', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
  tags: {
    Project: 'AppSyncAuthTest'
  }
});
