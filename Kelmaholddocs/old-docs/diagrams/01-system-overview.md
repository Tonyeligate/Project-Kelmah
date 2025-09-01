# Kelmah Platform - System Overview Architecture

This diagram provides a high-level overview of the entire Kelmah platform architecture, showing the relationship between frontend modules, API gateway, microservices, and infrastructure components.

## Architecture Overview

The Kelmah platform follows a modern microservices architecture with:

- **Frontend**: React-based SPA with modular domain-driven design
- **API Gateway**: Centralized entry point for all client requests
- **Microservices**: 6 domain-specific services (Auth, User, Job, Payment, Messaging, Review)
- **Infrastructure**: MongoDB, RabbitMQ, Redis, PostgreSQL
- **External Services**: Stripe, OAuth providers, Cloud storage

## Key Features

- **Modular Frontend**: 26+ domain-specific modules for maintainability
- **Microservices Architecture**: Independent, scalable services
- **Event-Driven Communication**: RabbitMQ for asynchronous processing
- **Real-time Messaging**: WebSocket support for instant communication
- **Secure Authentication**: JWT-based auth with refresh tokens
- **Payment Processing**: Integrated Stripe payment system

```mermaid
graph TB
    subgraph "KELMAH PLATFORM - SYSTEM OVERVIEW"
        subgraph "Frontend Layer"
            UI[React Frontend<br/>- Modular Architecture<br/>- Domain-Driven Design<br/>- 26+ Modules]
            
            subgraph "Frontend Modules"
                AUTH_MOD[Auth Module<br/>- Login/Register<br/>- Context + Redux<br/>- Token Management]
                JOB_MOD[Job Module<br/>- Listings<br/>- Applications<br/>- Management]
                MSG_MOD[Messaging Module<br/>- Real-time Chat<br/>- WebSocket<br/>- File Sharing]
                PAY_MOD[Payment Module<br/>- Stripe Integration<br/>- Wallet Management<br/>- Transactions]
                DASH_MOD[Dashboard Module<br/>- Worker Dashboard<br/>- Hirer Dashboard<br/>- Analytics]
            end
        end
        
        subgraph "API Layer"
            GATEWAY[API Gateway<br/>- Centralized Routing<br/>- Authentication<br/>- Rate Limiting<br/>- CORS Handling<br/>Port: 5000]
        end
        
        subgraph "Microservices Layer"
            AUTH_SVC[Auth Service<br/>- JWT Management<br/>- User Registration<br/>- OAuth Integration<br/>Port: 3001]
            USER_SVC[User Service<br/>- Profile Management<br/>- User Data<br/>- Settings<br/>Port: 3002]
            MSG_SVC[Messaging Service<br/>- Real-time Messaging<br/>- Socket.IO<br/>- File Uploads<br/>Port: 3003]
            JOB_SVC[Job Service<br/>- Job Listings<br/>- Applications<br/>- Contracts<br/>Port: 3004]
            PAY_SVC[Payment Service<br/>- Stripe Integration<br/>- Escrow System<br/>- Transactions<br/>Port: 3005]
            REV_SVC[Review Service<br/>- Rating System<br/>- Feedback<br/>- Analytics<br/>Port: 3006]
        end
        
        subgraph "Infrastructure Layer"
            MONGO[(MongoDB<br/>Document Storage<br/>Per-Service DBs)]
            POSTGRES[(PostgreSQL<br/>Relational Data<br/>Legacy Support)]
            RABBIT[RabbitMQ<br/>Message Broker<br/>Event Bus]
            REDIS[Redis<br/>Caching<br/>Session Store<br/>Rate Limiting]
        end
        
        subgraph "External Services"
            STRIPE[Stripe<br/>Payment Processing]
            OAUTH[OAuth Providers<br/>Google, LinkedIn]
            CLOUD[Cloud Storage<br/>File Management]
        end
    end
    
    %% Frontend to Gateway
    UI --> GATEWAY
    AUTH_MOD --> GATEWAY
    JOB_MOD --> GATEWAY
    MSG_MOD --> GATEWAY
    PAY_MOD --> GATEWAY
    DASH_MOD --> GATEWAY
    
    %% Gateway to Services
    GATEWAY --> AUTH_SVC
    GATEWAY --> USER_SVC
    GATEWAY --> MSG_SVC
    GATEWAY --> JOB_SVC
    GATEWAY --> PAY_SVC
    GATEWAY --> REV_SVC
    
    %% Services to Infrastructure
    AUTH_SVC --> MONGO
    USER_SVC --> MONGO
    MSG_SVC --> MONGO
    JOB_SVC --> MONGO
    PAY_SVC --> MONGO
    REV_SVC --> MONGO
    
    %% Legacy Data
    AUTH_SVC --> POSTGRES
    USER_SVC --> POSTGRES
    
    %% Message Broker
    AUTH_SVC --> RABBIT
    USER_SVC --> RABBIT
    MSG_SVC --> RABBIT
    JOB_SVC --> RABBIT
    PAY_SVC --> RABBIT
    REV_SVC --> RABBIT
    
    %% Caching
    GATEWAY --> REDIS
    AUTH_SVC --> REDIS
    
    %% External Integrations
    PAY_SVC --> STRIPE
    AUTH_SVC --> OAUTH
    MSG_SVC --> CLOUD
    
    %% WebSocket Connection
    MSG_MOD -.->|WebSocket| MSG_SVC
    
    %% Real-time Events
    RABBIT -.->|Events| UI
    
    classDef frontend fill:#e1f5fe
    classDef gateway fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef external fill:#fce4ec
    
    class UI,AUTH_MOD,JOB_MOD,MSG_MOD,PAY_MOD,DASH_MOD frontend
    class GATEWAY gateway
    class AUTH_SVC,USER_SVC,MSG_SVC,JOB_SVC,PAY_SVC,REV_SVC service
    class MONGO,POSTGRES,RABBIT,REDIS database
    class STRIPE,OAUTH,CLOUD external
```

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: Redux Toolkit + Context API
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Real-time**: WebSocket client

### Backend
- **Runtime**: Node.js with Express
- **Architecture**: Microservices with API Gateway
- **Database**: MongoDB (primary), PostgreSQL (legacy)
- **Message Queue**: RabbitMQ
- **Caching**: Redis
- **Authentication**: JWT with refresh tokens

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Deployment**: Render.com (Production)
- **File Storage**: AWS S3 / Cloud Storage
- **Payment**: Stripe Connect Platform
- **Monitoring**: Winston Logger + Health Checks

## Service Communication

1. **Synchronous**: HTTP/REST APIs through API Gateway
2. **Asynchronous**: RabbitMQ for event-driven communication
3. **Real-time**: WebSocket connections for messaging
4. **Caching**: Redis for session management and API caching