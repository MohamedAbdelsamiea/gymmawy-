# Nginx Configuration for File Uploads

## Problem
You're experiencing "413 Request Entity Too Large" errors when uploading videos. This happens because nginx (the web server) has a default client body size limit that's smaller than your application's requirements.

## Solution
You need to configure nginx to allow larger file uploads. Here are the configurations needed:

### 1. Nginx Configuration

Add or update the following directives in your nginx configuration file (usually `/etc/nginx/nginx.conf` or `/etc/nginx/sites-available/your-site`):

```nginx
server {
    # ... other server configuration ...
    
    # Increase client body size limit for file uploads
    client_max_body_size 100M;
    
    # Increase timeout for large file uploads
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Increase proxy timeouts for backend processing
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # ... rest of your configuration ...
}
```

### 2. If Using Docker/Container

If you're running nginx in a container, update your docker-compose.yml or nginx configuration:

```yaml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      # ... other volumes ...
    # ... other configuration ...
```

### 3. If Using a Reverse Proxy Setup

If nginx is acting as a reverse proxy to your Node.js application:

```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    
    # Upload size limits
    client_max_body_size 100M;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Pass through headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4. Reload Nginx Configuration

After making changes to nginx configuration:

```bash
# Test the configuration
sudo nginx -t

# Reload nginx if test passes
sudo systemctl reload nginx

# Or restart nginx
sudo systemctl restart nginx
```

## Current Application Limits

After the fixes applied to your codebase:

- **Images**: 10MB maximum
- **Videos**: 100MB maximum
- **Express body parser**: 100MB
- **Multer limits**: 100MB for videos, 10MB for images

## Testing

After configuring nginx, test your video uploads:

1. Try uploading a video file larger than 1MB but smaller than 100MB
2. Check that you no longer get the 413 error
3. Verify that files larger than 100MB still get rejected with a proper error message

## Troubleshooting

### Still getting 413 errors?
1. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify your nginx configuration: `sudo nginx -t`
3. Make sure you reloaded nginx after making changes
4. Check if there are multiple nginx configuration files that might override your settings

### Other common issues:
- **PHP upload limits**: If you have PHP-FPM configured, you might also need to update `upload_max_filesize` and `post_max_size` in PHP configuration
- **Load balancer limits**: If using a load balancer (like AWS ALB), check its configuration too
- **CDN limits**: If using a CDN, check its upload size limits

## Security Considerations

- Only increase upload limits for endpoints that actually need them
- Consider implementing file type validation
- Monitor disk space usage
- Implement proper cleanup of temporary files
- Consider using streaming uploads for very large files

## Example Complete Nginx Configuration

```nginx
server {
    listen 80;
    server_name gym.omarelnemr.xyz;
    
    # Upload limits
    client_max_body_size 100M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Serve static files
    location / {
        root /path/to/your/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Serve uploaded files
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```
