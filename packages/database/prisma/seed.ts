import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - nur für Development)
  // await prisma.message.deleteMany();
  // await prisma.conversationParticipant.deleteMany();
  // await prisma.conversation.deleteMany();
  // await prisma.listing.deleteMany();
  // await prisma.user.deleteMany();

  // Create test users
  const passwordHash = await bcrypt.hash('test123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'max.mustermann@example.com' },
    update: {},
    create: {
      email: 'max.mustermann@example.com',
      emailVerified: true,
      name: 'Max Mustermann',
      passwordHash,
      bio: 'Hobby-Gärtner und Werkzeug-Enthusiast',
      location: 'Nürnberg',
      phone: '+49 911 123456',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'anna.schmidt@example.com' },
    update: {},
    create: {
      email: 'anna.schmidt@example.com',
      emailVerified: true,
      name: 'Anna Schmidt',
      passwordHash,
      bio: 'Liebe es, Dinge zu reparieren und zu teilen',
      location: 'Nürnberg',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'admin@sharelocal.local' },
    update: {},
    create: {
      email: 'admin@sharelocal.local',
      emailVerified: true,
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Created users:', { user1: user1.email, user2: user2.email, user3: user3.email });

  // Create test listings
  const listing1 = await prisma.listing.create({
    data: {
      title: 'Akku-Bohrschrauber Bosch',
      description: 'Professioneller Akku-Bohrschrauber von Bosch. Ideal für Heimwerker-Projekte. Batterie und Ladegerät inklusive.',
      category: 'TOOL',
      type: 'OFFER',
      userId: user1.id,
      location: 'Nürnberg, Maxfeld',
      latitude: 49.4520,
      longitude: 11.0767,
      available: true,
      images: [],
      tags: ['werkzeug', 'bohrschrauber', 'bosch', 'elektrowerkzeug'],
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: 'Tomatenpflanzen suche',
      description: 'Suche nach Tomatenpflanzen für meinen Garten. Gerne verschiedene Sorten.',
      category: 'PLANT',
      type: 'REQUEST',
      userId: user2.id,
      location: 'Nürnberg, Gostenhof',
      latitude: 49.4480,
      longitude: 11.0680,
      available: true,
      images: [],
      tags: ['pflanzen', 'tomaten', 'garten'],
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: 'Reparatur-Service für Fahrräder',
      description: 'Biete Hilfe bei Fahrrad-Reparaturen an. Habe langjährige Erfahrung und Werkzeug.',
      category: 'SKILL',
      type: 'OFFER',
      userId: user1.id,
      location: 'Nürnberg',
      latitude: 49.4520,
      longitude: 11.0767,
      available: true,
      images: [],
      tags: ['service', 'fahrrad', 'reparatur', 'hilfe'],
    },
  });

  console.log('✅ Created listings:', {
    listing1: listing1.title,
    listing2: listing2.title,
    listing3: listing3.title,
  });

  // Create a test conversation
  const conversation = await prisma.conversation.create({
    data: {
      listingId: listing1.id,
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: user2.id,
            content: 'Hallo! Ist der Bohrschrauber noch verfügbar?',
            read: true,
          },
          {
            senderId: user1.id,
            content: 'Ja, gerne! Wann passt es dir?',
            read: false,
          },
        ],
      },
    },
  });

  console.log('✅ Created conversation with messages');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

