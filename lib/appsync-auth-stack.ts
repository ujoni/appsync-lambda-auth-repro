import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class AppSyncAuthStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly apiKey: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'TestUserPool', {
      userPoolName: 'test-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      }
    });

    // Create App Client
    const userPoolClient = userPool.addClient('TestAppClient', {
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      generateSecret: false
    });

    // Create test user using AWS Custom Resource
    const testUser = new cr.AwsCustomResource(this, 'TestUser', {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminCreateUser',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: process.env.TEST_USER_EMAIL,
          TemporaryPassword: process.env.TEST_USER_PASSWORD,
          MessageAction: 'SUPPRESS',
          UserAttributes: [
            {
              Name: 'email',
              Value: process.env.TEST_USER_EMAIL
            },
            {
              Name: 'email_verified',
              Value: 'true'
            }
          ]
        },
        physicalResourceId: cr.PhysicalResourceId.of(process.env.TEST_USER_EMAIL!)
      },
      onDelete: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminDeleteUser',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: process.env.TEST_USER_EMAIL
        }
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: [
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminSetUserPassword',
            'cognito-idp:AdminDeleteUser'
          ],
          resources: [userPool.userPoolArn]
        })
      ])
    });

    // Set permanent password for test user
    const setPassword = new cr.AwsCustomResource(this, 'SetTestUserPassword', {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminSetUserPassword',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: process.env.TEST_USER_EMAIL,
          Password: process.env.TEST_USER_PASSWORD,
          Permanent: true
        },
        physicalResourceId: cr.PhysicalResourceId.of('test-user-password')
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['cognito-idp:AdminSetUserPassword'],
          resources: [userPool.userPoolArn]
        })
      ])
    });

    // Ensure password is set after user is created
    setPassword.node.addDependency(testUser);

    // Create AppSync API with Lambda Authorization
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'test-api-test',
      schema: appsync.SchemaFile.fromAsset('schema.graphql'),
      authorizationConfig: {
        defaultAuthorization:
        {
          authorizationType: appsync.AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler: new nodejs.NodejsFunction(this, 'Authorizer', {
              entry: path.join(__dirname, '../src/lambda/authorizer.ts'),
              handler: 'handler',
            }),
          }
        }
      }
    });

    // Create the resolver for testQuery
    const none = api.addNoneDataSource('none');
    none.createResolver('TestQueryResolver', {
      typeName: 'Query',
      fieldName: 'testQuery',
      requestMappingTemplate: appsync.MappingTemplate.fromString('{ "version": "2018-05-29", "payload": null }'),
      responseMappingTemplate: appsync.MappingTemplate.fromString('"Hello from AppSync!"'),
    });

    // Output the API URL and API Key
    this.apiUrl = api.graphqlUrl;
    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: api.graphqlUrl,
      exportName: 'GraphQLApiUrl-test'
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId
    });

    new cdk.CfnOutput(this, 'TestUserEmail', {
      value: process.env.TEST_USER_EMAIL!
    });

    new cdk.CfnOutput(this, 'TestUserPassword', {
      value: process.env.TEST_USER_PASSWORD!
    });
  }
}
