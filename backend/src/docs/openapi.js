const port = process.env.PORT || 8080;
const baseServerUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

// Minimal OpenAPI spec documenting key public endpoints used by the frontend.
const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Branch Connect API',
    version: '1.0.0',
    description: 'REST API for Branch Connect. Includes batch listing and meta endpoints for pre-rendering placeholders.'
  },
  servers: [
    {
      url: baseServerUrl,
      description: 'Default server (honors PORT)'
    }
  ],
  paths: {
    '/batches': {
      get: {
        summary: 'List batches (paginated)',
        tags: ['Batches'],
        parameters: [
          {
            name: 'year',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Year filter (e.g., 2023). Currently optional.'
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 60, default: 12 }
          },
          {
            name: 'includeImages',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'When true, embeds image data URLs; disables caching for this response.'
          }
        ],
        responses: {
          200: {
            description: 'Paginated batch list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    hasMore: { type: 'boolean' },
                    nextPage: { type: 'integer', nullable: true },
                    users: { type: 'array', items: { type: 'object' } },
                    meta: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/batches/meta': {
      get: {
        summary: 'Get batch metadata and total user count',
        tags: ['Batches'],
        responses: {
          200: {
            description: 'Cached meta for rendering placeholders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    meta: {
                      type: 'object',
                      properties: {
                        years: { type: 'array', items: { type: 'integer' } },
                        branches: { type: 'array', items: { type: 'object' } },
                        batches: { type: 'array', items: { type: 'object' } },
                        updatedAt: { type: 'string', format: 'date-time', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Health status'
          }
        }
      }
    }
  },
  tags: [
    { name: 'Batches', description: 'Batch listing and metadata' },
    { name: 'Health', description: 'Service health checks' }
  ]
};

module.exports = openapiSpec;
