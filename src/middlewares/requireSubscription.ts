import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export const requireSubscription = async (req: Request | any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    // 1. Buscar dados do usuário no Firestore
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data() || {};
    const isSubscribed = userData.subscriptionStatus === 'active';
    
    // 2. Lógica de Trial (7 dias corridos)
    // Se o documento não tiver createdAt, fallback para o tempo de criação do Firebase Auth ou Date.now()
    let createdAtMillis = Date.now();
    if (userData.createdAt) {
      createdAtMillis = userData.createdAt.toDate().getTime();
    } else {
      const userRecord = await admin.auth().getUser(req.user.uid);
      createdAtMillis = new Date(userRecord.metadata.creationTime || Date.now()).getTime();
    }

    const trialEndsAt = new Date(createdAtMillis + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isTrialValid = now < trialEndsAt;

    // 3. Verificação de Acesso
    if (!isSubscribed && !isTrialValid) {
      return res.status(403).json({ 
        error: 'TRIAL_EXPIRED', 
        message: 'Seu período de teste expirou. Assine para continuar.' 
      });
    }

    // Passa no check
    next();
  } catch (error) {
    console.error('Erro no middleware requireSubscription:', error);
    return res.status(500).json({ error: 'Erro interno ao validar assinatura.' });
  }
};
