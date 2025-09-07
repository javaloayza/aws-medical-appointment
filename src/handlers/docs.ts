import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { openApiSpec } from '../docs/openapi';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const host = event.headers.Host || 'localhost:3030';
  const stage = event.requestContext.stage || 'dev';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}${stage === 'dev' ? '/dev' : `/${stage}`}`;

  try {
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: ''
      };
    }

    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }

    const pathParam = event.pathParameters?.proxy || '';

    // Serve OpenAPI JSON specification
    if (pathParam === 'openapi.json' || event.queryStringParameters?.format === 'json') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=3600'
        },
        body: JSON.stringify(openApiSpec, null, 2)
      };
    }

    // Default: Serve Swagger UI HTML
    const swaggerUI = generateSwaggerUI(baseUrl);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      },
      body: swaggerUI
    };

  } catch (error) {
    console.error('Error loading OpenAPI documentation:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Failed to load API documentation' })
    };
  }
};

function generateSwaggerUI(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Appointment API - Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.3/favicon-32x32.png" sizes="32x32" />
    <style>
      html { 
        box-sizing: border-box; 
        overflow: -moz-scrollbars-vertical; 
        overflow-y: scroll; 
      }
      *, *:before, *:after { 
        box-sizing: inherit; 
      }
      body { 
        margin: 0; 
        background: #fafafa; 
      }
      .swagger-ui .topbar { 
        background-color: #1976d2; 
      }
      .swagger-ui .topbar .download-url-wrapper .select-label { 
        color: #fff; 
      }
      .swagger-ui .info .title { 
        color: #1976d2; 
      }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${baseUrl}/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          console.error('Failed to load Swagger UI:', error);
        }
      });
    };
    </script>
</body>
</html>`;
}