import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seeding...');

  // --- CRIAÇÃO DOS USUÁRIOS ---
  const hashedPassword = await bcrypt.hash('senha123', 10);
  
  // 1. Garante que o usuário DIRETOR sempre exista
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

  // 2. Garante que o usuário COORDENADOR sempre exista
  const coordenador = await prisma.user.upsert({
    where: { email: 'coordenador@email.com' },
    update: { password: hashedPassword },
    create: {
      email: 'coordenador@email.com',
      name: 'Coordenador Regional',
      password: hashedPassword,
      role: 'COORDENADOR',
    },
  });
  console.log(`Usuário Coordenador garantido: ${coordenador.name}`);

  // 3. Garante que o usuário INSTRUTOR sempre exista
  const instrutor = await prisma.user.upsert({
    where: { email: 'instrutor@email.com' },
    update: { password: hashedPassword },
    create: {
      email: 'instrutor@email.com',
      name: 'Instrutor da Unidade',
      password: hashedPassword,
      role: 'INSTRUTOR',
    },
  });
  console.log(`Usuário Instrutor garantido: ${instrutor.name}`);

  // --- FIM DAS ALTERAÇÕES ---


  // --- CRIAÇÃO DAS UNIDADES ---
  console.log('Criando unidades de exemplo...');

  await prisma.unit.upsert({
    where: { name: 'Unidade Centro' },
    update: {},
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
