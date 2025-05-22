# Kelmah Authentication Service

This microservice handles all authentication-related functionalities for the Kelmah platform.

## Features

- User registration with email verification
- JWT-based authentication with token refresh
- Password reset functionality
- Role-based authorization (admin, worker, hirer)
- OAuth integration for social logins (Google, Facebook)
- Multi-factor authentication
- Enhanced security features

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the service directory by copying `.env.example`:
   ```
   cp .env.example .env
   ```

3. Update the environment variables in the `.env` file with your credentials:
   - Database connection (TimescaleDB or local PostgreSQL)
   - JWT secrets
   - Email service credentials
   - OAuth provider credentials (for social logins)

## OAuth Configuration

To enable social logins, you need to set up OAuth credentials with the respective providers:

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Navigate to APIs & Services > Credentials
4. Create an OAuth client ID (Web Application)
5. Set authorized redirect URIs to: `http://localhost:8080/api/auth/google/callback` (update for production)
6. Add the credentials to your `.env` file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Facebook OAuth

1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Create an App
3. Add the Facebook Login product
4. Set Valid OAuth Redirect URIs to: `http://localhost:8080/api/auth/facebook/callback` (update for production)
5. Add the credentials to your `.env` file:
   ```
   FACEBOOK_APP_ID=your-app-id
   FACEBOOK_APP_SECRET=your-app-secret
   ```

## Running the Service

Start the authentication service:

```
npm run start:auth
```

For development with hot reloading:

```
npm run dev:auth
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `GET /auth/verify/:token` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password/:token` - Reset password
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout a user

### OAuth

- `GET /auth/google` - Initiate Google authentication
- `GET /auth/google/callback` - Google authentication callback
- `GET /auth/facebook` - Initiate Facebook authentication
- `GET /auth/facebook/callback` - Facebook authentication callback

### Multi-Factor Authentication

- `POST /auth/mfa/setup` - Set up MFA for a user
- `POST /auth/mfa/verify` - Verify MFA for a user
- `POST /auth/mfa/disable` - Disable MFA for a user
- `POST /auth/mfa/validate` - Validate MFA token

### User Information

- `GET /auth/me` - Get current user information

## Database Models

- **User**: Stores user information including authentication details
- **RefreshToken**: Manages refresh tokens for extended sessions (if applicable)
- **VerificationToken**: Handles email verification tokens (if applicable)
- **PasswordReset**: Manages password reset requests (if applicable)

## Error Handling

- All endpoints return standardized error responses
- Authentication errors include detailed information for debugging
- Proper validation error handling for all inputs

## Testing

Run the tests:

```
npm run test:auth
```

## Troubleshooting

If you encounter issues:

1. Check the logs in the `logs` directory
2. Verify that your `.env` file contains all required variables
3. Ensure the database connection is properly configured
4. For OAuth issues, confirm that your redirect URIs match exactly

### Common Issues

- **OAuth credentials missing**: Social login will return a 501 error if credentials are not set
- **Database connection failed**: Check your connection string and database credentials
- **Email sending failed**: Verify your email service credentials 