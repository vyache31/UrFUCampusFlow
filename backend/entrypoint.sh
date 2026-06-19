#!/bin/sh
set -e

CERT_DIR="/backend/auth/certs"
PRIVATE="$CERT_DIR/jwt-private.pem"
PUBLIC="$CERT_DIR/jwt-public.pem"

mkdir -p "$CERT_DIR"

if [ ! -s "$PRIVATE" ] || [ ! -s "$PUBLIC" ]; then
  echo "Generating JWT keys..."

  openssl genpkey -algorithm RSA \
    -out "$PRIVATE" \
    -pkeyopt rsa_keygen_bits:2048

  openssl rsa -pubout \
    -in "$PRIVATE" \
    -out "$PUBLIC"
fi

echo "JWT keys ready:"
ls -la "$CERT_DIR"

exec "$@"