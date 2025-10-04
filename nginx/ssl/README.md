# SSL Certificates

Place your SSL certificates here for HTTPS support.

## Required Files:
- `cert.pem` - SSL Certificate
- `key.pem` - Private Key

## Generate Self-Signed Certificate (for development):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=EG/ST=Cairo/L=Cairo/O=YourCompany/CN=localhost"
```

## For Production:
Use certificates from a trusted Certificate Authority (CA) like Let's Encrypt.

