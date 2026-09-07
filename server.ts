import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import admin from 'firebase-admin';
import ocrRouter from './api/gemini/ocr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3000;

  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn('Firebase Admin initialization notice:', e);
    }
  }

  // CORS Middleware
  app.use(cors({
    origin: [process.env.FRONTEND_URL || 'https://estudojudo.com.br', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));

  async function requireAuth(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente.' });
    try {
      const token = authHeader.split('Bearer ')[1];
      req.user = await admin.auth().verifyIdToken(token);
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Sessão inválida.' });
    }
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.user && (req.user.admin === true || req.user.role === 'admin' || req.user.email === 'gustavomacedo.consultor@gmail.com')) return next();
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  // JSON and URL-encoded body parsers with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API routes FIRST
  app.get('/api/heartbeat', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
  });

  // Rotas protegidas conforme diretriz
  app.post('/api/corrigir-redacao', requireAuth, async (_req, res) => {
    res.json({ success: true, message: 'Endpoint protegido de redação ativo.' });
  });

  app.post('/api/admin/grant-access', requireAuth, requireAdmin, async (_req, res) => {
    res.json({ success: true, message: 'Acesso concedido com sucesso.' });
  });

  // Mount the modular OCR Router protegido com requireAuth
  app.use('/api/gemini/ocr', requireAuth, ocrRouter);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(__dirname, 'dist');
  
  if (!isProd) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware loaded');
    } catch (e) {
      console.warn('Failed to load Vite middleware, falling back to static serving');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    // Static files and SPA fallback
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
