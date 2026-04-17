# TrailBuddy Deployment Guide

This guide covers deploying TrailBuddy in various environments from development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100 Mbps

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 1 Gbps

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- SSL certificate (for production)

## Development Setup

### Quick Start with Docker Compose

1. **Clone the repository**
```bash
git clone https://github.com/your-username/trailbuddy.git
cd trailbuddy
```

2. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Configure API keys**
Edit the `.env` files with your actual API keys:
- Google Places API Key
- OpenAI API Key
- Razorpay Key ID and Secret
- Email configuration (Mailtrap for dev)

4. **Start services**
```bash
docker-compose up -d
```

5. **Verify deployment**
```bash
# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Access applications
curl http://localhost:3000  # Frontend
curl http://localhost:8080/api/actuator/health  # Backend health
```

### Manual Development Setup

#### Backend

1. **Install Java 17+**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS
brew install openjdk@17

# Windows
# Download from Oracle Java website
```

2. **Install MySQL 8.0+**
```bash
# Ubuntu/Debian
sudo apt install mysql-server

# macOS
brew install mysql

# Start MySQL
sudo systemctl start mysql
```

3. **Create database**
```bash
mysql -u root -p
CREATE DATABASE trailbuddy;
CREATE USER 'trailbuddy'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON trailbuddy.* TO 'trailbuddy'@'localhost';
FLUSH PRIVILEGES;
```

4. **Set up backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your configurations
./mvnw spring-boot:run
```

#### Frontend

1. **Install Node.js 18+**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

2. **Set up frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configurations
npm run dev
```

## Staging Deployment

### Docker Compose Staging

1. **Create staging configuration**
```bash
cp docker-compose.yml docker-compose.staging.yml
```

2. **Modify staging configuration**
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=staging
      - DB_HOST=mysql-staging
    ports:
      - "8081:8080"
  
  frontend:
    environment:
      - VITE_NODE_ENV=staging
    ports:
      - "3001:3000"
  
  mysql:
    container_name: trailbuddy-mysql-staging
    environment:
      MYSQL_DATABASE: trailbuddy_staging
```

3. **Deploy staging**
```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Kubernetes Staging

1. **Create Kubernetes manifests**
```bash
mkdir k8s/staging
```

2. **Deploy to staging**
```bash
kubectl apply -f k8s/staging/
kubectl get pods -n staging
```

## Production Deployment

### Option 1: Docker Compose (Single Server)

1. **Prepare production environment**
```bash
# Create production directories
mkdir -p /opt/trailbuddy/{mysql-data,uploads,logs,ssl}

# Set permissions
sudo chown -R $USER:$USER /opt/trailbuddy
chmod 755 /opt/trailbuddy
```

2. **Configure production environment**
```bash
cp docker-compose.yml docker-compose.prod.yml
```

3. **Production Docker Compose**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mysql:
    volumes:
      - /opt/trailbuddy/mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    restart: always

  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    volumes:
      - /opt/trailbuddy/uploads:/app/uploads
      - /opt/trailbuddy/logs:/app/logs
    restart: always
    depends_on:
      - mysql

  frontend:
    environment:
      - VITE_NODE_ENV=production
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - /opt/trailbuddy/ssl:/etc/nginx/ssl
    restart: always
    depends_on:
      - frontend
      - backend
```

4. **Deploy production**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes (Multi-server/Cloud)

1. **Prepare cluster**
```bash
# Using kubectl
kubectl cluster-info

# Create namespace
kubectl create namespace trailbuddy-prod
```

2. **Create secrets**
```bash
kubectl create secret generic trailbuddy-secrets \
  --from-literal=db-password=${DB_PASSWORD} \
  --from-literal=jwt-secret=${JWT_SECRET} \
  --from-literal=razorpay-key=${RAZORPAY_KEY} \
  -n trailbuddy-prod
```

3. **Deploy manifests**
```bash
kubectl apply -f k8s/production/ -n trailbuddy-prod
```

4. **Verify deployment**
```bash
kubectl get pods -n trailbuddy-prod
kubectl get services -n trailbuddy-prod
kubectl ingress -n trailbuddy-prod
```

### Cloud Deployment Options

#### AWS ECS

1. **Create ECS cluster**
2. **Build and push images to ECR**
3. **Create task definitions**
4. **Set up load balancer**
5. **Configure auto-scaling**

#### Google Cloud Run

1. **Containerize applications**
2. **Push to Google Container Registry**
3. **Deploy to Cloud Run**
4. **Configure domain mapping**

#### Azure Container Instances

1. **Create resource group**
2. **Deploy container instances**
3. **Configure Application Gateway**
4. **Set up monitoring**

## Environment Configuration

### Production Environment Variables

Create `.env.prod`:

```bash
# Database
DB_HOST=mysql
DB_NAME=trailbuddy
DB_USERNAME=trailbuddy
DB_PASSWORD=secure_password_123

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRATION=3600000

# Email (Production SMTP)
MAIL_HOST=smtp.your-domain.com
MAIL_PORT=587
MAIL_USERNAME=noreply@trailbuddy.com
MAIL_PASSWORD=your_email_password

# External APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
OPENAI_API_KEY=your_openai_api_key
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
```

### Application Profiles

**application-prod.yml:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

logging:
  level:
    com.trailbuddy: INFO
    org.springframework.security: WARN
  file:
    name: /app/logs/trailbuddy.log
  logback:
    rollingpolicy:
      max-file-size: 100MB
      max-history: 30
```

## Database Setup

### Production Database Configuration

1. **MySQL Configuration**
```sql
-- Create database
CREATE DATABASE trailbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'trailbuddy'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON trailbuddy.* TO 'trailbuddy'@'%';
FLUSH PRIVILEGES;

-- Import schema
mysql -u trailbuddy -p trailbuddy < database/schema.sql;
```

2. **MySQL Optimization**
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_size = 64M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

3. **Database Backup Script**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="trailbuddy"
DB_USER="trailbuddy"

mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p $DB_NAME | gzip > $BACKUP_DIR/trailbuddy_$DATE.sql.gz

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "trailbuddy_*.sql.gz" -mtime +7 -delete

echo "Backup completed: trailbuddy_$DATE.sql.gz"
```

4. **Cron job for backups**
```bash
# Add to crontab
0 2 * * * /opt/scripts/backup.sh
```

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

1. **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Generate SSL certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal**
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

1. **Generate CSR**
```bash
openssl req -new -newkey rsa:2048 -nodes -keyout private.key -out server.csr
```

2. **Submit CSR to CA**
3. **Install certificates**
```bash
sudo cp certificate.crt /etc/nginx/ssl/cert.pem
sudo cp private.key /etc/nginx/ssl/key.pem
sudo cp ca_bundle.crt /etc/nginx/ssl/chain.pem
```

### Nginx SSL Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring and Logging

### Application Monitoring

1. **Spring Boot Actuator**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
```

2. **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'trailbuddy-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/api/actuator/prometheus'
```

3. **Grafana Dashboard**
- Create dashboard for application metrics
- Monitor JVM metrics, database connections, API response times
- Set up alerts for critical metrics

### Log Management

1. **ELK Stack Setup**
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

2. **Logback Configuration**
```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/app/logs/trailbuddy.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/app/logs/trailbuddy.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>3GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

## Backup and Recovery

### Automated Backup Strategy

1. **Database Backup**
```bash
#!/bin/bash
# db-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/database"

mysqldump -u trailbuddy -p trailbuddy | gzip > $BACKUP_DIR/trailbuddy_$DATE.sql.gz

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/trailbuddy_$DATE.sql.gz s3://trailbuddy-backups/
```

2. **File Backup**
```bash
#!/bin/bash
# file-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/files"

tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/trailbuddy/uploads
aws s3 cp $BACKUP_DIR/uploads_$DATE.tar.gz s3://trailbuddy-backups/
```

3. **Recovery Procedures**
```bash
# Database recovery
gunzip < trailbuddy_backup.sql.gz | mysql -u trailbuddy -p trailbuddy

# File recovery
tar -xzf uploads_backup.tar.gz -C /opt/trailbuddy/
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connectivity
mysql -u trailbuddy -p -h localhost trailbuddy

# View logs
docker-compose logs mysql
```

2. **Application Not Starting**
```bash
# Check Java version
java -version

# Check port availability
netstat -tulpn | grep :8080

# View application logs
docker-compose logs backend
```

3. **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Test SSL configuration
nginx -t

# Reload Nginx
sudo nginx -s reload
```

4. **Performance Issues**
```bash
# Check system resources
top
free -h
df -h

# Check database performance
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check application metrics
curl http://localhost:8080/api/actuator/metrics
```

### Health Checks

1. **Application Health**
```bash
# Backend health
curl http://localhost:8080/api/actuator/health

# Frontend health
curl http://localhost:3000

# Database health
mysqladmin ping -h localhost -u trailbuddy -p
```

2. **Service Dependencies**
```bash
# Check all services
docker-compose ps

# Check service logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart [service-name]
```

### Performance Tuning

1. **JVM Tuning**
```bash
# Set JVM options in Dockerfile
ENV JAVA_OPTS="-Xmx2g -Xms1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

2. **Database Tuning**
```sql
-- Analyze query performance
EXPLAIN SELECT * FROM guides WHERE city = 'Jaipur';

-- Add indexes if needed
CREATE INDEX idx_guides_city ON guides(city);
```

3. **Nginx Tuning**
```nginx
# nginx.conf
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
```

## Security Best Practices

1. **Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
docker-compose up -d
```

2. **Security Scanning**
```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image trailbuddy-backend:latest
```

3. **Access Control**
```bash
# Use non-root user
RUN addgroup --system app && adduser --system --group app
USER app
```

4. **Network Security**
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

This deployment guide provides comprehensive instructions for deploying TrailBuddy in various environments. Always test in staging before deploying to production.
