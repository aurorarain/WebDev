# SingularityWalk

Personal portfolio website with dynamic project deployment, blog, and guestbook.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 + TailwindCSS |
| Backend | Java 17 + Spring Boot 3.2 |
| Database | MySQL (production) / H2 (development) |
| AI Model | EfficientNet-B3 (ONNX Runtime) + OpenCV |

## Project Structure

```
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   ├── services/  # API clients
│   │   ├── router/    # Route config
│   │   └── styles/    # Global CSS
│   └── vite.config.ts
├── backend/           # Spring Boot (Maven)
│   └── src/main/
│       ├── java/com/emotion/
│       │   ├── controller/
│       │   ├── service/
│       │   ├── entity/
│       │   ├── config/
│       │   └── security/
│       └── resources/
│           ├── application.yml       # Development (H2)
│           ├── application-prod.yml  # Production (MySQL)
│           └── data.sql              # Seed data
└── training/          # Model training scripts
```

## Local Development

### Prerequisites

- Java 17+
- Node.js 16+
- Maven 3.6+

### Run

```bash
# Backend (port 8080)
cd backend
mvn spring-boot:run

# Frontend (port 5173, proxies /api to backend)
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

## Production Deployment

### First-time Setup

```bash
# 1. Clone to server
git clone https://github.com/aurorarain/SingularityWalk.git /var/www
cd /var/www

# 2. Install dependencies
sudo apt install openjdk-17-jdk maven nginx mysql-server -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Create database
sudo mysql -e "CREATE DATABASE singularitywalk CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'singularitywalk'@'127.0.0.1' IDENTIFIED BY 'YOUR_PASSWORD';"
sudo mysql -e "GRANT ALL ON singularitywalk.* TO 'singularitywalk'@'127.0.0.1';"

# 4. Create data directories
sudo mkdir -p /var/www/singularitywalk/{uploads,embedded-projects,models}
sudo chown -R $USER:$USER /var/www/singularitywalk

# 5. Build
cd /var/www/frontend && npm install && npm run build
cd /var/www/backend && mvn clean package -DskipTests

# 6. Configure Nginx (see deploy/nginx.conf)

# 7. Start backend with systemd (see deploy/singularitywalk.service)
```

### Update from GitHub

```bash
cd /var/www
./deploy.sh
```

This script pulls latest code, rebuilds frontend & backend, and restarts the backend service.

## Features

- **Project Showcase** - Portfolio with thumbnails, category filters, markdown descriptions
- **Dynamic Deployment** - Clone GitHub repos, auto-build, on-demand start/stop embedded projects
- **Blog** - Markdown-based blog with image upload
- **Guestbook** - Public message board with admin approval
- **Admin Panel** - Manage projects, blog posts, site config
- **FER Demo** - Live facial emotion recognition (EfficientNet-B3 + OpenCV)

## Author

Zhihao Ji
