import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import ocrRouter from './api/gemini/ocr';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API routes FIRST
  app.get('/api/heartbeat', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
  });

  // Mount the modular OCR Router
  app.use('/api/gemini/ocr', ocrRouter);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  
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
