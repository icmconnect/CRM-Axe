import fs from 'fs';

const csv = fs.readFileSync('data.csv', 'utf-8');
const lines = csv.split('\n').filter(l => l.trim() !== '');
const headers = lines[0].split(',');

const parseDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const parseMoney = (moneyStr) => {
  if (!moneyStr) return 0;
  return parseFloat(moneyStr.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
};

const cleanCPF = (cpf) => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

const formatCPF = (cpf) => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const membros = [];

// Skip header
for (let i = 1; i < lines.length; i++) {
  // Simple CSV parse handling quotes
  const row = [];
  let inQuotes = false;
  let currentVal = '';
  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  row.push(currentVal.trim());

  if (row.length < 5) continue;

  const email = row[1] || '';
  const nome = row[2] || '';
  const rg = row[3] || '';
  const cpf = formatCPF(row[4] || '');
  const nascimento = parseDate(row[5] || '');
  const endereco = row[6] || '';
  const bairro = row[7] || '';
  const cidade = row[8] || '';
  const cep = row[9] || '';
  const estado = row[10] || '';
  const whatsapp = cleanPhone(row[11] || '');
  const escolaridade = row[13] || '';
  const profissao = row[14] || '';
  const contribuicao = parseMoney(row[15] || '');

  // Check if it's a dependent (e.g., same email as someone else, or minor)
  const isDependent = false;

  membros.push({
    nome,
    email,
    rg,
    cpf,
    nascimento,
    endereco,
    numero: '', // Will leave empty or user can edit
    bairro,
    cidade,
    estado,
    whatsapp,
    profissao,
    escolaridade,
    contribuicao,
    status: 'Ativo',
    isDependent
  });
}

// Handle dependents (same email as previous)
const emailMap = {};
membros.forEach(m => {
  if (m.email) {
    if (!emailMap[m.email]) {
      emailMap[m.email] = m;
    } else {
      m.isDependent = true;
      m.emailResponsavel = m.email;
    }
  }
});

console.log(JSON.stringify(membros, null, 2));
