# Visitor Management System Backend

## Enhanced for College Environments with Load Balancing and Optimization

This backend system has been optimized to handle high request volumes in a college environment with load balancing, error handling, caching, and performance monitoring.

## Features

### Load Balancing
- **Cluster-based Load Balancing**: Utilizes Node.js cluster module to distribute requests across multiple CPU cores
- **Worker Process Management**: Automatically restarts crashed worker processes
- **Horizontal Scaling**: Ready for deployment across multiple servers with a load balancer

### Performance Optimization
- **Response Compression**: Reduces bandwidth usage and improves response times
- **In-memory Caching**: Reduces database load for frequently accessed data
- **Rate Limiting**: Prevents abuse and ensures fair resource allocation
- **Connection Pooling**: Optimizes database connections for high throughput

### Error Handling and Reliability
- **Comprehensive Error Handling**: Consistent error responses across the application
- **Request Monitoring**: Tracks response times and error rates
- **Health Checks**: Endpoint for monitoring system health
- **Graceful Error Recovery**: Handles unexpected errors without crashing

### Security Enhancements
- **Helmet Integration**: Sets HTTP headers for enhanced security
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Prevents injection attacks
- **CORS Configuration**: Restricts access to trusted origins

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/visitor-system
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

### Running the Server

#### Development Mode
```
npm run dev
```

#### Production Mode with Load Balancing
```
npm run start:cluster
```

## API Endpoints

The system provides the following main API endpoints:

- `/auth` - Authentication routes
- `/visitors` - Visitor management
- `/students` - Student management
- `/faculty` - Faculty-related operations
- `/admin` - Administrative functions
- `/stats` - System statistics
- `/health` - System health check

## Monitoring and Maintenance

### Health Check
Access the `/health` endpoint to get system status information:

```
GET /health
```

Response includes:
- System uptime
- Memory usage
- CPU usage
- Connection status

### Performance Metrics
Access the `/metrics` endpoint (admin access required) to view detailed performance metrics:

```
GET /metrics
```

Response includes:
- Request counts and response times
- Error rates
- Endpoint usage statistics
- System resource utilization

## Best Practices for Deployment

1. **Use Process Manager**: Deploy with PM2 for additional process management capabilities
2. **Implement Reverse Proxy**: Use Nginx or Apache as a reverse proxy
3. **Enable SSL/TLS**: Secure all communications with HTTPS
4. **Regular Backups**: Schedule regular database backups
5. **Monitoring**: Set up alerts for system health issues

## Scaling for Higher Loads

For extremely high loads, consider:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Database Sharding**: Distribute database load across multiple servers
3. **Dedicated Caching Layer**: Implement Redis for more advanced caching
4. **CDN Integration**: Use a CDN for static assets
5. **Microservices**: Split into smaller, specialized services

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks using tools like `node-memwatch`
   - Increase server memory allocation

2. **Slow Response Times**
   - Check database query performance
   - Review caching implementation
   - Check for network latency issues

3. **Connection Errors**
   - Verify database connection settings
   - Check network firewall settings
   - Ensure MongoDB service is running

## License

ISC