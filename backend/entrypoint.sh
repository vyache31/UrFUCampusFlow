#!/bin/sh

CERT_DIR="/backend/auth/certs"

mkdir -p "$CERT_DIR"

PRIVATE_KEY="$CERT_DIR/jwt-private.pem"
PUBLIC_KEY="$CERT_DIR/jwt.public.pem"

if [ ! -f "$PRIVATE_KEY" ]; then
  echo "Generating JWT keys..."

  openssl genpkey -algorithm RSA \
    -out "$PRIVATE_KEY" \
    -pkeyopt rsa_keygen_bits:2048

  openssl rsa -pubout \
    -in "$PRIVATE_KEY" \
    -out "$PUBLIC_KEY"
fi

exec "$@"