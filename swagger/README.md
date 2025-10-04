# 📖 Swagger Documentation Guide

## Overview

This directory contains OpenAPI 3.0 specifications for the LMS Authentication API. These files are used to generate the interactive Swagger UI documentation.

## Files

- `authentication.yaml` - User authentication endpoints (register, login, password reset)
- `profile.yaml` - Profile management endpoints (email/phone change)
- `admin.yaml` - Admin authentication endpoints
- `health.yaml` - Health check and status endpoints

## Accessing the Documentation

### Local Development
```
http://localhost:3000/api-docs
```

### Features

- **Interactive Testing**: Try out API endpoints directly from the browser
- **Request/Response Examples**: View sample data for each endpoint
- **Authentication**: Test protected endpoints with JWT tokens
- **Schema Validation**: See detailed request/response schemas
- **Export**: Download the OpenAPI specification

## Using Swagger UI

### 1. View Endpoints
All endpoints are organized by tags (Authentication, Profile, Admin, Health).

### 2. Authenticate
For protected endpoints:
1. Click the **"Authorize"** button at the top
2. Enter: `Bearer <your_jwt_token>`
3. Click **"Authorize"**
4. Click **"Close"**

### 3. Try It Out
1. Click on an endpoint to expand it
2. Click **"Try it out"** button
3. Fill in the parameters/body
4. Click **"Execute"**
5. View the response below

### 4. View Schemas
Click on "Schemas" at the bottom to see data models:
- User
- Error
- Success

## Customizing Documentation

### Adding New Endpoints

1. Create/edit YAML files in this directory
2. Follow OpenAPI 3.0 specification format
3. Server will automatically reload the documentation

### Example Endpoint Structure

```yaml
paths:
  /api/your-endpoint:
    post:
      tags:
        - YourTag
      summary: Brief description
      description: Detailed description
      security:
        - bearerAuth: []  # If protected
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - field1
              properties:
                field1:
                  type: string
                  example: value
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
```

## OpenAPI Specification

The complete OpenAPI specification can be accessed at:
```
http://localhost:3000/api-docs.json
```

Use this to:
- Import into Postman
- Generate client SDKs
- Integrate with other tools
- Share with frontend teams

## Testing with Swagger

### Complete Registration Flow

1. **Register** (`POST /api/user-auth/register`)
   - Use "Try it out"
   - Enter email
   - Note the `userId` from response

2. **Verify OTP** (`POST /api/user-auth/verify-email-otp`)
   - Check console logs for OTP (if email not configured)
   - Enter email and OTP
   - Note the `userId` from response

3. **Complete Profile** (`POST /api/user-auth/complete-profile`)
   - Enter userId, name, and password
   - Copy the JWT token from response

4. **Authorize**
   - Click "Authorize" button
   - Enter: `Bearer <token>`
   - Click "Authorize"

5. **Test Protected Endpoints**
   - Try any endpoint under "Profile" tag
   - Should work without additional auth setup

## Alternative Documentation Tools

### Postman
Import the collection from:
```
/postman/LMS_Authentication_API.postman_collection.json
```

### ReDoc
For a different documentation style:
```bash
npm install redoc-express
```

### Swagger Editor
Edit YAML files with validation:
```
https://editor.swagger.io/
```

## Tips

- 💡 **Persist Authorization**: Swagger UI remembers your token across page refreshes
- 💡 **Dark Mode**: Not supported by default, but can be customized in `config/swagger.js`
- 💡 **Filter**: Use the filter box to search endpoints
- 💡 **Curl Command**: Each request shows the equivalent curl command
- 💡 **Response Time**: Displays how long each request took

## Troubleshooting

### Documentation not loading
- Check if server is running
- Verify YAML syntax is valid
- Check console for errors

### Authentication not working
- Ensure token is prefixed with "Bearer "
- Check token hasn't expired (7 days default)
- Verify token is from a successful login

### Examples not showing
- Ensure `examples` section is properly formatted
- Use `example` (singular) for single values
- Use `examples` (plural) for multiple options

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [YAML Syntax](https://learnxinyminutes.com/docs/yaml/)

---

**Last Updated**: October 4, 2025
