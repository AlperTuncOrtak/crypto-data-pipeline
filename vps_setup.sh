#!/bin/bash
# ==========================================
# Crypto Data Pipeline - VPS Setup Script
# Ubuntu 22.04 / 24.04
# ==========================================

echo "🚀 Starting Server Provisioning..."

# 1. Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git curl nginx ufw

# 2. Configure Firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 3. Setup Project Directory
PROJECT_DIR="/var/www/crypto-data-pipeline"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📦 Cloning Repository..."
    # Kullanıcı kendi GitHub URL'sini buraya girecek (Örn: AlperTuncOrtak)
    sudo git clone https://github.com/AlperTuncOrtak/crypto-data-pipeline.git $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
else
    echo "📦 Project directory already exists. Pulling latest changes..."
    cd $PROJECT_DIR && git pull origin v2-migration
fi

# 4. Setup Python Virtual Environment
echo "🐍 Setting up Python Environment..."
cd $PROJECT_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt

# 5. Create Systemd Service for FastAPI
echo "⚙️ Creating Systemd Service for Backend..."
SERVICE_FILE="/etc/systemd/system/cryptobackend.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=Gunicorn/Uvicorn instance to serve Crypto Backend
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
EnvironmentFile=$PROJECT_DIR/backend/.env
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start cryptobackend
sudo systemctl enable cryptobackend

# 6. Setup Nginx Reverse Proxy
echo "🌐 Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/cryptobackend"
sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name _; # You can replace this with your domain name later

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSockets support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/cryptobackend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Setup Complete! Your backend should be running on Port 80."
echo "Don't forget to create /var/www/crypto-data-pipeline/backend/.env file with your API keys!"
