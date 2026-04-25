<<<<<<< HEAD
# Kinok — Kindle Ebook Browser

**All the Books. Always With You.**

Gateway para Anna's Archive optimizado para Kindle.

---

## Estructura del proyecto

```
kinok/
├── pages/
│   ├── index.js        ← Frontend Kindle (toda la UI)
│   └── api/
│       └── search.js   ← Proxy que busca en Anna's Archive
├── next.config.js
├── package.json
└── README.md
```

---

## Deploy en Vercel (paso a paso)

### 1. Subir a GitHub

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "kinok inicial"

# Crear repo en github.com, luego:
git remote add origin https://github.com/TU-USUARIO/kinok.git
git branch -M main
git push -u origin main
```

### 2. Conectar a Vercel

1. Ir a **vercel.com** → Log in with GitHub
2. Click **"Add New Project"**
3. Importar el repo `kinok`
4. Dejar todo por defecto (Next.js se detecta solo)
5. Click **"Deploy"**

✅ En 1 minuto tenés la URL lista.

### 3. Actualizar en el futuro

```bash
git add .
git commit -m "cambio"
git push
```
Vercel se actualiza automáticamente.

---

## Desarrollo local

```bash
npm install
npm run dev
# Abrir http://localhost:3000
```

---

## Cómo funciona

1. El Kindle abre `kinok.vercel.app`
2. El usuario busca un libro con el teclado on-screen
3. La app llama a `/api/search?q=...` (tu servidor en Vercel)
4. El servidor le pega a Anna's Archive (prueba 3 mirrors automáticamente)
5. Devuelve los resultados al Kindle
6. El usuario elige libro → formato → se abre Anna's Archive directo

### Mirrors usados (en orden)
- `annas-archive.gl`
- `annas-archive.se`  
- `annas-archive.li`

Si uno falla, prueba el siguiente automáticamente.
=======
# kinok
>>>>>>> dcd492b2802e7545fc2968db4d16e13156af1141
