# Deployment Architecture

This diagram illustrates the complete deployment architecture of the Kelmah platform, showing both production deployment on Render.com and local development environment setup.

## Deployment Overview

The Kelmah platform supports multiple deployment environments:

- **Production**: Render.com cloud deployment
- **Development**: Local Docker Compose setup
- **External Services**: Third-party integrations
- **Monitoring**: Logging and analytics infrastructure

## Architecture Diagram

```mermaid
graph TB
    subgraph "DEPLOYMENT ARCHITECTURE"
        subgraph "Production Environment - Render.com"
            subgraph "Frontend Deployment"
                FE_SERVICE[Kelmah Frontend<br/>- Static Site Hosting<br/>- CDN Distribution<br/>- Automatic Deployments<br/>URL: kelmah-frontend.onrender.com]
            end
            
            subgraph "Backend Services"
                GW_SERVICE[API Gateway<br/>- Entry Point<br/>- Load Balancer<br/>- SSL Termination<br/>URL: kelmah-api-gateway.onrender.com]
                
                AUTH_SERVICE[Auth Service<br/>- User Authentication<br/>- JWT Management<br/>- OAuth Integration<br/>URL: kelmah-auth-service.onrender.com]
                
                USER_SERVICE[User Service<br/>- Profile Management<br/>- User Operations<br/>- Search & Discovery<br/>URL: kelmah-user-service.onrender.com]
                
                JOB_SERVICE[Job Service<br/>- Job Management<br/>- Applications<br/>- Contracts<br/>URL: kelmah-job-service.onrender.com]
                
                MSG_SERVICE[Messaging Service<br/>- Real-time Chat<br/>- WebSocket Support<br/>- File Uploads<br/>URL: kelmah-messaging-service.onrender.com]
                
                PAY_SERVICE[Payment Service<br/>- Stripe Integration<br/>- Escrow System<br/>- Webhooks<br/>URL: kelmah-payment-service.onrender.com]
                
                REV_SERVICE[Review Service<br/>- Rating System<br/>- Analytics<br/>- Moderation<br/>URL: kelmah-review-service.onrender.com]
            end
            
            subgraph "Database Services"
                MONGO_ATLAS[MongoDB Atlas<br/>- Document Database<br/>- Multi-region<br/>- Automated Backups<br/>- Connection Pooling]
                
                POSTGRES_SERVICE[PostgreSQL<br/>- Relational Data<br/>- Legacy Support<br/>- ACID Compliance]
            end
            
            subgraph "Message Queue"
                RABBITMQ_CLOUD[CloudAMQP<br/>- Message Broker<br/>- Event Bus<br/>- Reliable Delivery<br/>- Management Interface]
            end
            
            subgraph "Caching & Storage"
                REDIS_CLOUD[Redis Cloud<br/>- Session Storage<br/>- API Caching<br/>- Rate Limiting]
                
                S3_STORAGE[AWS S3<br/>- File Storage<br/>- Image Uploads<br/>- Document Storage<br/>- CDN Integration]
            end
        end
        
        subgraph "Development Environment"
            subgraph "Local Development"
                LOCAL_FE[Local Frontend<br/>- Vite Dev Server<br/>- Hot Reload<br/>- Port: 5173]
                
                LOCAL_DOCKER[Docker Compose<br/>- All Services<br/>- Local MongoDB<br/>- Local RabbitMQ<br/>- Local Redis]
            end
            
            subgraph "Container Services"
                DOCKER_GW[API Gateway Container<br/>Port: 5000]
                DOCKER_AUTH[Auth Service Container<br/>Port: 3001]
                DOCKER_USER[User Service Container<br/>Port: 3002]
                DOCKER_MSG[Messaging Container<br/>Port: 3003]
                DOCKER_JOB[Job Service Container<br/>Port: 3004]
                DOCKER_PAY[Payment Container<br/>Port: 3005]
                DOCKER_REV[Review Container<br/>Port: 3006]
                
                DOCKER_MONGO[MongoDB Container<br/>Port: 27017]
                DOCKER_RABBIT[RabbitMQ Container<br/>Port: 5672, 15672]
                DOCKER_REDIS[Redis Container<br/>Port: 6379]
                DOCKER_POSTGRES[PostgreSQL Container<br/>Port: 5432]
            end
        end
        
        subgraph "External Services"
            STRIPE[Stripe<br/>- Payment Processing<br/>- Webhooks<br/>- Connect Platform]
            
            OAUTH_GOOGLE[Google OAuth<br/>- Social Login<br/>- Profile Data]
            
            OAUTH_LINKEDIN[LinkedIn OAuth<br/>- Professional Login<br/>- Profile Data]
            
            EMAIL_SERVICE[Email Service<br/>- Transactional Emails<br/>- Notifications<br/>- Templates]
            
            SMS_SERVICE[SMS Service<br/>- Verification Codes<br/>- Notifications]
        end
        
        subgraph "Monitoring & Analytics"
            LOGGING[Centralized Logging<br/>- Winston Logger<br/>- Error Tracking<br/>- Performance Metrics]
            
            ANALYTICS[Analytics<br/>- User Behavior<br/>- Business Metrics<br/>- Performance Data]
            
            MONITORING[Health Monitoring<br/>- Service Status<br/>- Uptime Tracking<br/>- Alerts]
        end
    end
    
    %% Production Flow
    FE_SERVICE --> GW_SERVICE
    GW_SERVICE --> AUTH_SERVICE
    GW_SERVICE --> USER_SERVICE
    GW_SERVICE --> JOB_SERVICE
    GW_SERVICE --> MSG_SERVICE
    GW_SERVICE --> PAY_SERVICE
    GW_SERVICE --> REV_SERVICE
    
    %% Database Connections
    AUTH_SERVICE --> MONGO_ATLAS
    USER_SERVICE --> MONGO_ATLAS
    JOB_SERVICE --> MONGO_ATLAS
    MSG_SERVICE --> MONGO_ATLAS
    PAY_SERVICE --> MONGO_ATLAS
    REV_SERVICE --> MONGO_ATLAS
    
    AUTH_SERVICE --> POSTGRES_SERVICE
    USER_SERVICE --> POSTGRES_SERVICE
    
    %% Message Queue
    AUTH_SERVICE --> RABBITMQ_CLOUD
    USER_SERVICE --> RABBITMQ_CLOUD
    JOB_SERVICE --> RABBITMQ_CLOUD
    MSG_SERVICE --> RABBITMQ_CLOUD
    PAY_SERVICE --> RABBITMQ_CLOUD
    REV_SERVICE --> RABBITMQ_CLOUD
    
    %% Caching
    GW_SERVICE --> REDIS_CLOUD
    AUTH_SERVICE --> REDIS_CLOUD
    
    %% File Storage
    MSG_SERVICE --> S3_STORAGE
    USER_SERVICE --> S3_STORAGE
    
    %% Development Flow
    LOCAL_FE --> LOCAL_DOCKER
    LOCAL_DOCKER --> DOCKER_GW
    LOCAL_DOCKER --> DOCKER_AUTH
    LOCAL_DOCKER --> DOCKER_USER
    LOCAL_DOCKER --> DOCKER_MSG
    LOCAL_DOCKER --> DOCKER_JOB
    LOCAL_DOCKER --> DOCKER_PAY
    LOCAL_DOCKER --> DOCKER_REV
    LOCAL_DOCKER --> DOCKER_MONGO
    LOCAL_DOCKER --> DOCKER_RABBIT
    LOCAL_DOCKER --> DOCKER_REDIS
    LOCAL_DOCKER --> DOCKER_POSTGRES
    
    %% External Integrations
    PAY_SERVICE --> STRIPE
    AUTH_SERVICE --> OAUTH_GOOGLE
    AUTH_SERVICE --> OAUTH_LINKEDIN
    AUTH_SERVICE --> EMAIL_SERVICE
    AUTH_SERVICE --> SMS_SERVICE
    
    %% Monitoring
    GW_SERVICE --> LOGGING
    AUTH_SERVICE --> LOGGING
    USER_SERVICE --> LOGGING
    JOB_SERVICE --> LOGGING
    MSG_SERVICE --> LOGGING
    PAY_SERVICE --> LOGGING
    REV_SERVICE --> LOGGING
    
    FE_SERVICE --> ANALYTICS
    GW_SERVICE --> MONITORING
    
    classDef frontend fill:#e3f2fd
    classDef service fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef queue fill:#f3e5f5
    classDef external fill:#fce4ec
    classDef development fill:#f1f8e9
    classDef monitoring fill:#fff8e1
    
    class FE_SERVICE,LOCAL_FE frontend
    class GW_SERVICE,AUTH_SERVICE,USER_SERVICE,JOB_SERVICE,MSG_SERVICE,PAY_SERVICE,REV_SERVICE,DOCKER_GW,DOCKER_AUTH,DOCKER_USER,DOCKER_MSG,DOCKER_JOB,DOCKER_PAY,DOCKER_REV service
    class MONGO_ATLAS,POSTGRES_SERVICE,REDIS_CLOUD,S3_STORAGE,DOCKER_MONGO,DOCKER_RABBIT,DOCKER_REDIS,DOCKER_POSTGRES database
    class RABBITMQ_CLOUD queue
    class STRIPE,OAUTH_GOOGLE,OAUTH_LINKEDIN,EMAIL_SERVICE,SMS_SERVICE external
    class LOCAL_DOCKER,DOCKER_GW,DOCKER_AUTH,DOCKER_USER,DOCKER_MSG,DOCKER_JOB,DOCKER_PAY,DOCKER_REV,DOCKER_MONGO,DOCKER_RABBIT,DOCKER_REDIS,DOCKER_POSTGRES development
    class LOGGING,ANALYTICS,MONITORING monitoring
```

## Production Deployment (Render.com)

### Frontend Deployment
- **Static Site Hosting**: React build deployed as static assets
- **CDN Distribution**: Global content delivery for performance
- **Automatic Deployments**: Git-based CI/CD pipeline
- **SSL/TLS**: Automatic HTTPS certificate management
- **Custom Domain**: Professional domain configuration

### Backend Services
Each microservice is deployed as a separate Render service:

#### API Gateway (Port 5000)
- **Entry Point**: Single endpoint for all client requests
- **Load Balancing**: Traffic distribution across service instances
- **SSL Termination**: HTTPS handling and certificate management
- **Rate Limiting**: API throttling and abuse prevention

#### Microservices (Ports 3001-3006)
- **Independent Deployment**: Each service deploys separately
- **Auto-scaling**: Dynamic resource allocation based on load
- **Health Checks**: Automatic restart on service failure
- **Zero-downtime Deployment**: Rolling updates without interruption

### Database Services

#### MongoDB Atlas
- **Managed Database**: Fully managed MongoDB service
- **Multi-region Replication**: Data redundancy and disaster recovery
- **Automated Backups**: Point-in-time recovery capabilities
- **Connection Pooling**: Efficient database connection management
- **Security**: Encryption at rest and in transit

#### PostgreSQL
- **Managed PostgreSQL**: Render PostgreSQL service
- **Legacy Data Support**: Migration from existing systems
- **ACID Compliance**: Reliable transaction processing
- **Automated Backups**: Regular backup scheduling

### Infrastructure Services

#### CloudAMQP (RabbitMQ)
- **Message Broker**: Managed RabbitMQ service
- **Event Bus**: Inter-service communication
- **Reliable Delivery**: Message persistence and acknowledgment
- **Management Interface**: Web-based monitoring and administration

#### Redis Cloud
- **Session Storage**: User session management
- **API Caching**: Response caching for performance
- **Rate Limiting**: Request throttling data
- **Real-time Data**: WebSocket session management

#### AWS S3
- **File Storage**: User uploads and media files
- **CDN Integration**: CloudFront for global distribution
- **Security**: Access controls and encryption
- **Backup**: Versioning and lifecycle management

## Development Environment

### Local Development Setup

#### Frontend Development
- **Vite Dev Server**: Fast development server with HMR
- **Hot Module Replacement**: Instant code changes
- **Proxy Configuration**: API calls routed to backend services
- **Development Tools**: React DevTools, Redux DevTools

#### Docker Compose
Complete local environment with:
- **All Microservices**: Full backend stack
- **Databases**: MongoDB, PostgreSQL, Redis
- **Message Queue**: RabbitMQ with management interface
- **Networking**: Service discovery and communication

### Container Configuration

#### Service Containers
Each service runs in its own container:
- **Isolated Environment**: Consistent runtime across machines
- **Port Mapping**: Standard port assignments
- **Volume Mounting**: Code and data persistence
- **Environment Variables**: Configuration management

#### Infrastructure Containers
- **MongoDB**: Document database with data persistence
- **PostgreSQL**: Relational database for legacy data
- **RabbitMQ**: Message broker with management UI
- **Redis**: Caching and session storage

## External Service Integrations

### Payment Processing
- **Stripe Connect**: Multi-party payment platform
- **Webhook Handling**: Real-time payment notifications
- **Escrow System**: Secure fund holding and release
- **Dispute Resolution**: Payment conflict management

### Authentication Services
- **Google OAuth**: Social login integration
- **LinkedIn OAuth**: Professional network login
- **JWT Management**: Token generation and validation
- **Multi-factor Authentication**: Enhanced security

### Communication Services
- **Email Service**: Transactional email delivery
- **SMS Service**: Text message notifications
- **Push Notifications**: Mobile app notifications
- **Template Management**: Dynamic content generation

## Monitoring and Analytics

### Logging Infrastructure
- **Centralized Logging**: Winston logger across all services
- **Error Tracking**: Exception monitoring and alerting
- **Performance Metrics**: Response time and throughput
- **Audit Trails**: User action and system event logging

### Business Analytics
- **User Behavior**: Page views, feature usage, conversion rates
- **Business Metrics**: Revenue, transaction volume, user growth
- **Performance Data**: API response times, error rates
- **Custom Events**: Job posting, application, contract completion

### Health Monitoring
- **Service Status**: Real-time service availability
- **Uptime Tracking**: Service reliability metrics
- **Alert System**: Notification for service failures
- **Dashboard**: Visual monitoring interface

## Security and Compliance

### Network Security
- **TLS/SSL**: Encrypted communication channels
- **Firewall Rules**: Network access controls
- **VPN Access**: Secure administrative access
- **DDoS Protection**: Traffic filtering and rate limiting

### Data Security
- **Encryption at Rest**: Database and file encryption
- **Encryption in Transit**: HTTPS and secure protocols
- **Access Controls**: Role-based permissions
- **Data Anonymization**: Privacy protection for analytics

### Compliance
- **GDPR Compliance**: European data protection
- **PCI DSS**: Payment card security standards
- **SOC 2**: Security and availability controls
- **Regular Audits**: Security assessment and testing

## Deployment Pipeline

### CI/CD Process
1. **Code Push**: Developer commits to Git repository
2. **Automated Testing**: Unit and integration test execution
3. **Build Process**: Application compilation and packaging
4. **Deployment**: Automatic deployment to Render services
5. **Health Checks**: Post-deployment verification
6. **Rollback**: Automatic rollback on deployment failure

### Environment Management
- **Development**: Local Docker environment
- **Staging**: Pre-production testing environment
- **Production**: Live user-facing environment
- **Feature Branches**: Isolated feature development