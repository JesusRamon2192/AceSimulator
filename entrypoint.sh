#!/bin/sh

# Generate env.js with the provided OPENAI_API_KEY environment variable
if [ -n "$OPENAI_API_KEY" ]; then
  echo "window.ENV = { OPENAI_API_KEY: '$OPENAI_API_KEY' };" > /usr/share/nginx/html/env.js
  echo "✅ env.js generated with provided API Key."
else
  # Check if env.js already exists (if it was copied during build)
  if [ ! -f /usr/share/nginx/html/env.js ]; then
    echo "window.ENV = { OPENAI_API_KEY: '' };" > /usr/share/nginx/html/env.js
    echo "⚠️ Warning: OPENAI_API_KEY not set. Empty env.js created."
  fi
fi

# Execute CMD
exec "$@"
