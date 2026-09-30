# 🚀 Mausam Bharat — VPS Deployment & Subdomain Configuration Guide

This guide describes how to deploy the **Mausam Bharat Weather Platform** on your Linux VPS with **complete process and network isolation** from your other existing applications, routed cleanly through a **single subdomain** (e.g. `weather.yourdomain.com`).

---

## 🛡️ Isolation Strategy

To guarantee that this project never interferes with other websites, databases, or Node/Python runtimes on your VPS:
1. **Network Isolation**: The backend (Express) and frontend (Next.js) live on a private internal Docker bridge network (`india_weather_internal_network`).
2. **Port Protection**: 
   - The backend port (`5000`) is **not exposed to the host machine at all**.
   - The frontend port only binds to `127.0.0.1:${APP_PORT:-3000}` on loopback — **never to `0.0.0.0`**. It cannot be accessed directly from the public internet bypassing your reverse proxy or firewall.
3. **Port Collision Prevention**: If port `3000` is already in use by another app on your server, simply set `APP_PORT=3080` (or any free port) in `.env`.
4. **Single Subdomain Architecture**: Next.js automatically rewrites `/api/*` to the backend container internally. You do **not** need a separate subdomain or exposed port for the API!

---

## ⚡ Quick Start (1-Click Deployment)

On your VPS:

```bash
# 1. Clone your repository
git clone git@github.com:Yogesh-Kumar-Mallik-dev/india-weather-app.git
cd india-weather-app

# 2. Configure environment (optional, defaults to port 3000)
cp .env.example .env
nano .env

# 3. Run the automated deployment script
./deploy/deploy.sh
```

---

## 🌐 Subdomain Routing Configurations

Point your domain DNS (e.g. `weather.yourdomain.com`) to your VPS IP address using an **A record** (or **CNAME**).

### Option 1: Using Host Nginx (Recommended if you already use Nginx)

1. Copy the configuration file:
   ```bash
   sudo cp deploy/nginx/subdomain.conf /etc/nginx/sites-available/weather.conf
   ```

2. Edit the file to replace `weather.yourdomain.com` with your real subdomain, and confirm the port matches `APP_PORT` from your `.env`:
   ```bash
   sudo nano /etc/nginx/sites-available/weather.conf
   ```

3. Enable the site and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/weather.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Issue free SSL with Let's Encrypt / Certbot:
   ```bash
   sudo certbot --nginx -d weather.yourdomain.com
   ```

---

### Option 2: Using Caddy (Zero-Config Automatic SSL)

If your VPS uses Caddy as its reverse proxy, add this block to `/etc/caddy/Caddyfile`:

```caddyfile
weather.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
}
```

Then reload Caddy:
```bash
sudo systemctl reload caddy
```
Caddy will automatically obtain and renew Let's Encrypt certificates.

---

### Option 3: Using Cloudflare Tunnel (Zero Open Ports)

If you use Cloudflare Tunnels (`cloudflared`):
1. In Cloudflare Zero Trust Dashboard -> **Networks** -> **Tunnels**.
2. Add a Public Hostname:
   - **Subdomain**: `weather`
   - **Domain**: `yourdomain.com`
   - **Service Type**: `HTTP`
   - **URL**: `127.0.0.1:3000`
3. Save. No firewall port opening or SSL certificate setup is required.

---

## 🔄 Useful Operations & Maintenance

| Action | Command |
|---|---|
| **View live logs** | `docker compose logs -f` |
| **Check container health** | `docker compose ps` |
| **Restart services** | `docker compose restart` |
| **Update with latest code** | `git pull && ./deploy/deploy.sh` |
| **Stop application** | `docker compose down` |

---

## 🔒 Security Best Practices Applied
- Both containers run as unprivileged, non-root users (`node` in backend, `nextjs` in frontend).
- Next.js uses standalone mode, discarding all compilation toolchains and dev dependencies from the production image.
- Secretless architecture: no external API keys or credentials needed.
