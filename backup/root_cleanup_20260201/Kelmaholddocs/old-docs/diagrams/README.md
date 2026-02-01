# Kelmah Platform - Architecture Diagrams

This directory contains comprehensive architecture diagrams for the Kelmah platform, providing detailed visual documentation of the system design, data flows, and deployment architecture.

## 📁 Diagram Contents

### [01 - System Overview](./01-system-overview.md)
**High-level architecture overview showing the entire platform structure**
- Frontend modules and organization
- API Gateway and microservices
- Infrastructure components (databases, message queue, caching)
- External service integrations
- Technology stack overview

### [02 - Frontend Architecture](./02-frontend-architecture.md)
**Detailed frontend structure with modular design patterns**
- React application entry points and configuration
- State management layer (Redux + Context API)
- Domain-specific modules (Auth, Jobs, Messaging, etc.)
- API communication layer with service clients
- Routing and navigation architecture

### [03 - Data Flow Sequence](./03-data-flow-sequence.md)
**Complete data flow sequences through the platform**
- Authentication flow with JWT token management
- Job posting and application workflows
- Real-time messaging with WebSocket
- Payment processing with Stripe integration
- Event-driven updates and caching strategies

### [04 - Microservices Architecture](./04-microservices-architecture.md)
**Internal structure of backend microservices**
- API Gateway routing and middleware
- Service-specific controllers, models, and business logic
- Database organization and relationships
- Inter-service communication patterns
- Message queue event processing

### [05 - Database Models](./05-database-models.md)
**Entity relationship diagram for all data models**
- User management domain (Users, Auth tokens)
- Job management domain (Jobs, Applications, Contracts)
- Messaging domain (Conversations, Messages)
- Payment domain (Transactions, Wallets, Escrow)
- Review and notification systems

### [06 - Deployment Architecture](./06-deployment-architecture.md)
**Production and development deployment configurations**
- Render.com production deployment
- Local Docker Compose development setup
- External service integrations (Stripe, OAuth, Storage)
- Monitoring and analytics infrastructure
- Security and compliance measures

## 🎯 Key Architectural Highlights

### **Modular Frontend Design**
- 26+ domain-specific modules for maintainability
- Consistent module structure with pages, components, and services
- Hybrid state management with Redux and Context API
- Service-specific API clients for backend communication

### **Microservices Backend**
- 6 independent microservices plus API Gateway
- Domain-driven design with clear service boundaries
- Event-driven architecture using RabbitMQ
- MongoDB primary database with PostgreSQL legacy support

### **Scalable Infrastructure**
- Containerized deployment with Docker
- Horizontal scaling capabilities
- Multi-level caching with Redis
- Real-time features with WebSocket support

### **Security & Reliability**
- JWT-based authentication with refresh tokens
- Secure payment processing with Stripe
- Comprehensive error handling and monitoring
- Production-ready deployment on Render.com

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: Redux Toolkit + Context API
- **UI Library**: Material-UI (MUI)
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
- **File Storage**: AWS S3
- **Payment**: Stripe Connect Platform
- **Monitoring**: Winston Logger + Health Checks

## 📖 How to Use These Diagrams

1. **Start with System Overview** to understand the big picture
2. **Frontend Architecture** for UI development understanding
3. **Data Flow Sequence** to understand user interactions
4. **Microservices Architecture** for backend development
5. **Database Models** for data structure understanding
6. **Deployment Architecture** for DevOps and deployment

Each diagram includes:
- Visual Mermaid diagrams for clear understanding
- Detailed explanations of components and relationships
- Technology choices and architectural decisions
- Best practices and design patterns used

## 🔄 Keeping Diagrams Updated

These diagrams should be updated when:
- New services or modules are added
- Database schema changes occur
- Deployment infrastructure is modified
- Major architectural decisions are made

## 📝 Diagram Format

All diagrams are created using **Mermaid** syntax for:
- Version control compatibility
- Easy editing and maintenance
- Consistent visual formatting
- Integration with documentation platforms

---

*Last Updated: January 2025*  
*Platform Version: v2.0.0*