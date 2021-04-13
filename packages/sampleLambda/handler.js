// Example workspace dependency 
import pad from 'sampleDependency';

/**
 * Lambda handler for the webhook
 *
 * @param event - lambda event
 * @returns a promise with an HTTP Response
 */
export function handler({
  headers,
  body,
}) {
  return Promise.resolve({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: pad('Received lambda successfully'),
    }),
  });
};
