import * as dotenv from 'dotenv';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

// Load environment variables from .env file
dotenv.config();

const {
  API_URL,
  USER_POOL_ID,
  USER_POOL_CLIENT_ID,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD
} = process.env;

if (!API_URL || !USER_POOL_ID || !USER_POOL_CLIENT_ID || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('Required environment variables are not set');
}

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: USER_POOL_CLIENT_ID
});

const query = `
  query TestQuery {
    testQuery
  }
`;

async function authenticateUser(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        resolve(result.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
}

const performQuery = async (token: string) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });
  return response.json();
};

describe('AppSync API Tests', () => {
  let idToken: string;

  beforeAll(async () => {
    // Authenticate and get token before running tests
    idToken = await authenticateUser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
  }, 15_000);

  it('should make two consecutive calls with Cognito auth token', async () => {
    // First call
    const data1 = await performQuery(idToken);
    expect(data1).toEqual({ data: { testQuery: 'Hello from AppSync!' } });

    // Sleep for a 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2_000));

    // Second call - should use cached auth result
    const data2 = await performQuery(idToken);
    expect(data2).toEqual({ data: { testQuery: 'Hello from AppSync!' } });
  }, 20_000);
});
