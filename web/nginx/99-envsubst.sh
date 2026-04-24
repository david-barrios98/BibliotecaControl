#!/bin/sh
set -eu

# Generate nginx conf from template using env vars.
# We only substitute what we need to keep it safe.
envsubst '${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

