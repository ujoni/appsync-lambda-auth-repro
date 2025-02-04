import { AppSyncAuthorizerHandler } from 'aws-lambda';

interface AuthorizerResponse {
  entitiesWithAccess?: string;
  accessInfo?: string;
  targetOrganizationIDs?: string;
}

export const handler: AppSyncAuthorizerHandler<AuthorizerResponse> = async (event) => {
  console.log(event);
  const token = event.authorizationToken;

  if (token?.startsWith('Bearer ')) {
    return {
      isAuthorized: true,
      resolverContext: {
        entitiesWithAccess: "a",
        accessInfo: "evr,evw,evs,dvr,dvw,dte,dsw,dvo,dvc,ota,otd,oto,msr,sts,usr,uss,usw,orr,oru,ord,ctr,ctw,pg,pp",
        targetOrganizationIDs: "a",
      },
      // ttlOverride: 5 * 60 * 1000, // cache response for 5 minutes
    };
  }

  return {
    isAuthorized: false
  };
};
