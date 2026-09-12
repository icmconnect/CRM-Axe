import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import ocrRouter from './api/gemini/ocr';

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

  // INÍCIO - ROTAS STRIPE (Webhook precisa vir ANTES do express.json)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2026-08-26.dahlia',
  });

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      if (!webhookSecret) throw new Error('Webhook secret ausente');
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Processamento dos eventos
    try {
      const db = admin.firestore();
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          if (userId) {
            await db.collection('users').doc(userId).set({
              stripeCustomerId: session.customer,
              subscriptionStatus: 'active',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Buscar usuário pelo customerId
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: subscription.status,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          break;
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error('Erro ao processar evento:', error);
      res.status(500).send('Erro interno');
    }
  });
  // FIM - ROTAS STRIPE

  // JSON and URL-encoded body parsers with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Checkout Stripe
  app.get('/api/checkout', async (req, res) => {
    const planId = req.query.plan as string;
    const userId = req.query.userId as string; // Em uma API real segura, use o token JWT para pegar o ID.

    // Importar config
    // Para simplificar, estamos pegando a constante diretamente para não travar o build caso a importação falhe:
    const prices: Record<string, string> = {
      essencial: 'price_1UEag7BejuJh61udGrM5w6oo',
      comunidade: 'price_1UEahkBejuJh61udF758QtDQ',
      federacao: 'price_1UEaiWBejuJh61uduZGizvCM',
      anual: 'price_1UEajLBejuJh61udOqNGOrVQ',
    };

    const priceId = prices[planId];
    if (!priceId) return res.status(400).json({ error: 'Plano inválido' });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          { price: priceId, quantity: 1 }
        ],
        mode: 'subscription',
        client_reference_id: userId || 'anonymous',
        success_url: `${req.headers.origin || `${req.protocol}://${req.get('host')}`}/#/planos?success=true`,
        cancel_url: `${req.headers.origin || `${req.protocol}://${req.get('host')}`}/#/planos?canceled=true`,
      });

      if (session.url) {
        res.redirect(303, session.url);
      } else {
        res.status(500).json({ error: 'Erro ao gerar checkout' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
