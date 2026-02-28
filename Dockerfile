FROM nginx:alpine

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html/

# Make entrypoint script executable
RUN chmod +x /usr/share/nginx/html/entrypoint.sh

# Expose port 80
EXPOSE 80

# Use our custom entrypoint script
ENTRYPOINT ["/usr/share/nginx/html/entrypoint.sh", "nginx", "-g", "daemon off;"]
