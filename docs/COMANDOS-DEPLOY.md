# 🚀 COMANDOS EXACTOS PARA DEPLOYMENT

## SUBIR A GITHUB:
```bash
cd "C:\03 BachilleratoHeroesWeb"
git add .
git commit -m "🚀 Proyecto con backend listo para Vercel"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/bachillerato-heroes-patria.git
git push -u origin main
```

## VARIABLES DE ENTORNO EN VERCEL:
```
JWT_SECRET = HeroesPatria2024_JWT_SUPER_SECRETO_PARA_PRODUCCION_VERCEL_123456789
SESSION_SECRET = HeroesPatria2024_SESSION_SECRETO_PARA_PRODUCCION_VERCEL_987654321
NODE_ENV = production
CORS_ORIGIN = https://tu-proyecto.vercel.app
```

## CONTRASEÑA ADMIN:
```
HeroesPatria2024!
```

## CONFIGURACIÓN VERCEL:
- Framework: Other
- Build Command: npm run build
- Output Directory: .
- Install Command: npm run install-server