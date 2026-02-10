import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o processo de seeding (Multi-Empresa)...');

  // 1. Limpeza Segura: Remove dados antigos para recriar com a nova estrutura de empresas.
  // A ordem de deleção importa por causa das chaves estrangeiras.
  await prisma.companyTransfer.deleteMany();
  await prisma.request.deleteMany();
  await prisma.unitItem.deleteMany();
  await prisma.stockEntryItem.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.item.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('🧹 Banco de dados limpo.');

  // 2. Criar Empresas
  const ipControl = await prisma.company.create({
    data: {
      name: 'IP Control',
      cnpj: '11.111.111/0001-11',
    },
  });

  const ipTech = await prisma.company.create({
    data: {
      name: 'IP Tech',
      cnpj: '22.222.222/0001-22',
    },
  });

  console.log('🏢 Empresas criadas: IP Control e IP Tech');

  // --- CRIAÇÃO DOS USUÁRIOS ---
  const hashedPassword = await bcrypt.hash('senha123', 10);

  // 3. Diretor Geral (Acesso a AMBAS as empresas)
  const diretor = await prisma.user.create({
    data: {
      email: 'diretor@email.com',
      name: 'Diretor Geral',
      password: hashedPassword,
      role: 'DIRETOR',
      companies: {
        connect: [
          { id: ipControl.id },
          { id: ipTech.id }
        ]
      }
    },
  });
  console.log(`👤 Usuário Diretor criado (Acesso total).`);

  // 4. Coordenador (Acesso APENAS à IP Control)
  const coordenador = await prisma.user.create({
    data: {
      email: 'coordenador@email.com',
      name: 'Coordenador Regional',
      password: hashedPassword,
      role: 'COORDENADOR',
      companies: {
        connect: [{ id: ipControl.id }]
      },
      createdById: diretor.id
    },
  });
  console.log(`👤 Usuário Coordenador criado (IP Control).`);

  // 5. Instrutor (Acesso APENAS à IP Control)
  const instrutor = await prisma.user.create({
    data: {
      email: 'instrutor@email.com',
      name: 'Instrutor da Unidade',
      password: hashedPassword,
      role: 'INSTRUTOR',
      companies: {
        connect: [{ id: ipControl.id }]
      },
      createdById: diretor.id // Opcional: indicar quem criou
    },
  });
  console.log(`👤 Usuário Instrutor criado (IP Control).`);


  // --- CRIAÇÃO DAS UNIDADES (Vinculadas à IP Control) ---
  console.log('🏭 Criando unidades de exemplo para IP Control...');

  await prisma.unit.create({
    data: {
      name: 'Unidade Centro',
      companyId: ipControl.id,
      coordinatorId: coordenador.id
    },
  });

  await prisma.unit.create({
    data: {
      name: 'Unidade Norte',
      companyId: ipControl.id,
      coordinatorId: coordenador.id
    },
  });

  await prisma.unit.create({
    data: {
      name: 'Unidade Sul',
      companyId: ipControl.id,
      coordinatorId: coordenador.id // Usando o mesmo coord para teste
    },
  });

  // --- CRIAÇÃO DE ITENS (Exemplo) ---
  console.log('📦 Criando itens de exemplo...');
  
  // Item para IP Control
  await prisma.item.create({
    data: {
      name: 'Notebook Dell',
      description: 'Notebook Corporativo',
      unitOfMeasure: 'UN',
      quantity: 10,
      companyId: ipControl.id
    }
  });

  // Item para IP Tech (Para testar se aparece misturado depois - não deve aparecer na IP Control)
  await prisma.item.create({
    data: {
      name: 'Servidor Rack',
      description: 'Equipamento de Datacenter',
      unitOfMeasure: 'UN',
      quantity: 2,
      companyId: ipTech.id
    }
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });