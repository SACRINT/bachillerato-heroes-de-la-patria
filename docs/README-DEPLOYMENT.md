# 🚀 GUÍA DE DEPLOYMENT - Bachillerato Héroes

## 🏆 OPCIÓN 1: VERCEL (RECOMENDADO - GRATIS)

### Paso a Paso:

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Subir a GitHub**
   ```bash
   git add .
   git commit -m "🚀 Proyecto listo para deployment"
   git push origin main
   ```

3. **Deploy con Vercel**
   ```bash
   vercel
   ```

4. **Configurar Variables de Entorno en Vercel:**
   - Ve a tu dashboard de Vercel
   - Selecciona tu proyecto
   - Ve a Settings → Environment Variables
   - Agrega estas variables:
     ```
     JWT_SECRET=tu_clave_secreta_super_larga_y_segura_64_caracteres
     SESSION_SECRET=otra_clave_secreta_diferente_64_caracteres
     NODE_ENV=production
     CORS_ORIGIN=https://tu-proyecto.vercel.app
     ```

## 🚀 OPCIÓN 2: RAILWAY ($5/mes)

1. **Conectar GitHub a Railway**
   - Ve a railway.app
   - Conecta tu repositorio

2. **Variables de entorno se configuran automáticamente**

## 🔧 OPCIÓN 3: VPS (DigitalOcean/Hostinger)

### En el servidor:
```bash
# 1. Clonar proyecto
git clone tu-repositorio.git
cd tu-proyecto

# 2. Instalar dependencias
npm run install-server

# 3. Configurar variables de entorno
cp server/.env.production server/.env
# Editar .env con valores reales

# 4. Instalar PM2 (para mantener el servidor corriendo)
npm install -g pm2

# 5. Iniciar en producción
pm2 start server/server.js --name "heroes-backend"

# 6. Configurar proxy reverso (Nginx)
# Archivo: /etc/nginx/sites-available/heroes
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /path/to/tu/proyecto;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔐 CONTRASEÑA DE ADMINISTRADOR

La contraseña por defecto es: **HeroesPatria2024!**

⚠️ **CAMBIARLA INMEDIATAMENTE EN PRODUCCIÓN**

## 🌐 URLs después del deployment:

- **Frontend:** https://tu-dominio.com
- **API:** https://tu-dominio.com/api
- **Login:** https://tu-dominio.com → Menú Admin

## 📞 SOPORTE

Si necesitas ayuda, revisa los logs:
```bash
# Vercel
vercel logs

# Railway
railway logs

# VPS
pm2 logs heroes-backend
```