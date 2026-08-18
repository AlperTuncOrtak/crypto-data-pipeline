cat << 'NGINX' > /etc/nginx/sites-available/cryptobackend
server {
    server_name api.cryptoneko.online 167.233.18.232.nip.io;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSockets support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.cryptoneko.online/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.cryptoneko.online/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = api.cryptoneko.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = 167.233.18.232.nip.io) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name api.cryptoneko.online 167.233.18.232.nip.io;
    return 404; # managed by Certbot
}
NGINX
systemctl reload nginx
