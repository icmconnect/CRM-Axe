const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const cronEndpoint = `
// CRON Job endpoint to check trials and send emails
app.post('/api/cron/check-trials', express.json(), async (req, res) => {
  // In a real scenario, this would be protected by a cron secret
  // const secret = req.headers['x-cron-secret'];
  try {
    const casasRef = db.collection('casas_axe');
    const snapshot = await casasRef.where('status', '==', 'trial').get();
    
    const hoje = new Date();
    let emailsEnviados = 0;
    
    snapshot.forEach(doc => {
      const casa = doc.data();
      if (casa.trial_ate) {
        const trialAte = new Date(casa.trial_ate);
        const diffTime = trialAte.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Se faltam exatamente 2 dias (ou menos e ainda não avisou)
        if (diasRestantes === 2) {
          console.log(\`[CRON] Enviando email de trial para: \${casa.admin_email} (Casa: \${casa.nome})\`);
          // AQUI entraria a integração com SendGrid / Resend / Nodemailer
          // ex: await sendEmail({ to: casa.admin_email, template: 'trial_warning' })
          emailsEnviados++;
        }
      }
    });
    
    res.json({ success: true, message: \`\${emailsEnviados} e-mails de aviso de trial processados.\` });
  } catch (error) {
    console.error('Erro no cron de trials:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
`;

const insertPos = code.lastIndexOf('app.get(\'*all\',');
if (insertPos !== -1) {
  code = code.slice(0, insertPos) + cronEndpoint + '\n  ' + code.slice(insertPos);
  fs.writeFileSync('server.ts', code);
}
