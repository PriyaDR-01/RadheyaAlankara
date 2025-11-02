// Simple health check function for debugging Netlify deployment
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
        headers: event.headers
      },
      context: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        awsRequestId: context.awsRequestId
      },
      environment: {
        nodeVersion: process.version,
        cwd: process.cwd(),
        __dirname: __dirname || 'not available'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debug, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};
