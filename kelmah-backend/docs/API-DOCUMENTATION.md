# Kelmah API Documentation

This document provides comprehensive documentation for all API endpoints in the Kelmah platform's microservice architecture.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [User Service](#user-service)
3. [Job Service](#job-service)
4. [Messaging Service](#messaging-service)
5. [Payment Service](#payment-service)
6. [Review Service](#review-service)
7. [Common Response Formats](#common-response-formats)
8. [Error Handling](#error-handling)

## Base URLs

Each service has its own base URL when running locally:

- **API Gateway**: `http://localhost:5000/api`
- **Authentication Service**: `http://localhost:3001/api`
- **User Service**: `http://localhost:3002/api`
- **Messaging Service**: `http://localhost:3003/api`
- **Job Service**: `http://localhost:3004/api`
- **Payment Service**: `http://localhost:3005/api`
- **Review Service**: `http://localhost:3006/api`

When using the API Gateway (recommended), all requests should go through:
```
http://localhost:5000/api/{service-name}/{endpoint}
```

## Authentication

Most API endpoints require authentication. To authenticate requests, include an Authorization header with a valid JWT token:

```
Authorization: Bearer {your_jwt_token}
```

A token can be obtained by using the login endpoint of the Authentication Service.

## Common Response Formats

All API endpoints follow a consistent response format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message describing what went wrong"
  }
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- **200 OK**: The request was successful
- **201 Created**: The resource was successfully created
- **400 Bad Request**: The request was malformed or invalid
- **401 Unauthorized**: Authentication is required or invalid
- **403 Forbidden**: The authenticated user doesn't have permission
- **404 Not Found**: The requested resource was not found
- **409 Conflict**: The request conflicts with the current state
- **500 Internal Server Error**: An unexpected error occurred on the server

## API Documentation for Each Service

Detailed documentation for each service's endpoints can be found in their respective documentation files:

- [Authentication Service Documentation](./auth-service-api.md)
- [User Service Documentation](./user-service-api.md)
- [Job Service Documentation](./job-service-api.md)
- [Messaging Service Documentation](./messaging-service-api.md)
- [Payment Service Documentation](./payment-service-api.md)
- [Review Service Documentation](./review-service-api.md) 