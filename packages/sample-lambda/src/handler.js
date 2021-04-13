// Example workspace dependency 
import { pad } from 'sample-dependency';

// Example aws dependency that will be excluded from both the lambda and lambda layer as Lambda has them built in
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

/**
 * Lambda handler for the webhook
 *
 * @param event - lambda event
 * @returns a promise with an HTTP Response
 */
export async function handler() {
  const client = new STSClient();
  const { Arn } = await client.send(new GetCallerIdentityCommand({}))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: pad(`Received lambda successfully on lambda with arn: ${ Arn }`),
    }),
  };
};
