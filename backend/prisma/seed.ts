import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // --- CRIAÇÃO DO USUÁRIO ---
  const hashedPassword = await bcrypt.hash('senha123', 10);
  
  // Garante que o usuário diretor sempre exista com a mesma senha
  const diretor = await prisma.user.upsert({
    where: { email: 'diretor@email.com' },
    update: { password: hashedPassword },
    create: {
      email: 'diretor@email.com',
      name: 'Diretor Geral',
      password: hashedPassword,
      role: 'DIRETOR',
    },
  });
  console.log(`Usuário Diretor garantido: ${diretor.name}`);

  // --- INÍCIO DAS ALTERAÇÕES ---

  // --- CRIAÇÃO DAS UNIDADES ---
  console.log('Criando unidades de exemplo...');

  // Usamos 'upsert' para evitar criar duplicatas se rodarmos o seed várias vezes
  await prisma.unit.upsert({
    where: { name: 'Unidade Centro' },
    update: {}, // Não faz nada se já existir
    create: { name: 'Unidade Centro' },
  });

  await prisma.unit.upsert({
    where: { name: 'Unidade Norte' },
    update: {},
    create: { name: 'Unidade Norte' },
  });

  await prisma.unit.upsert({
    where: { name: 'Unidade Sul' },
    update: {},
    create: { name: 'Unidade Sul' },
  });

  console.log('Unidades de exemplo criadas/verificadas.');

  // --- FIM DAS ALTERAÇÕES ---

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
