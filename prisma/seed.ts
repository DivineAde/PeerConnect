/**
 * Seed data for local development / demo purposes.
 * Run with: pnpm db:seed
 *
 * Demo login for every seeded account: password "Passw0rd!"
 */
import { PrismaClient, ConnectionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

const people = [
  {
    email: "divine.okafor@peerconnect.dev",
    name: "Divine Okafor",
    headline: "Full-stack Engineer at Abbey",
    bio: "I build reliable, well-tested products end to end — from schema design to pixel-level polish on the frontend.",
    location: "Lagos, Nigeria",
    avatarUrl: null,
  },
  {
    email: "amara.chen@peerconnect.dev",
    name: "Amara Chen",
    headline: "Product Designer, Design Systems",
    bio: "Focused on typography, spacing, and the small details that make an interface feel considered.",
    location: "Singapore",
    avatarUrl: null,
  },
  {
    email: "liam.osei@peerconnect.dev",
    name: "Liam Osei",
    headline: "Backend Engineer — Payments",
    bio: "Ten years building auth systems and payment infrastructure. Currently deep in distributed transactions.",
    location: "Accra, Ghana",
    avatarUrl: null,
  },
  {
    email: "sofia.reyes@peerconnect.dev",
    name: "Sofia Reyes",
    headline: "Engineering Manager",
    bio: "Grew a 4-person team into a 20-person org. I care most about giving engineers room to do their best work.",
    location: "Mexico City, Mexico",
    avatarUrl: null,
  },
  {
    email: "kenji.tanaka@peerconnect.dev",
    name: "Kenji Tanaka",
    headline: "DevOps & Platform Engineer",
    bio: "Kubernetes, CI/CD, and making deploys boring. Previously at two Y Combinator startups.",
    location: "Tokyo, Japan",
    avatarUrl: null,
  },
  {
    email: "priya.nair@peerconnect.dev",
    name: "Priya Nair",
    headline: "Frontend Engineer — React & Accessibility",
    bio: "Passionate about building interfaces that work well for everyone, including keyboard and screen-reader users.",
    location: "Bengaluru, India",
    avatarUrl: null,
  },
]

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const users = [];
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: { ...person, passwordHash, provider: "PASSWORD" },
    });
    users.push(user);
  }

  const [divine, amara, liam, sofia, kenji, priya] = users;

  // Helper to create a normalized connection row.
  async function connect(
    requesterId: string,
    receiverId: string,
    status: ConnectionStatus
  ) {
    const [userLowId, userHighId] = [requesterId, receiverId].sort();
    await prisma.connection.upsert({
      where: { userLowId_userHighId: { userLowId, userHighId } },
      update: { status },
      create: { requesterId, receiverId, status, userLowId, userHighId },
    });
  }

  // Divine <-> Amara: accepted connection
  await connect(divine.id, amara.id, "ACCEPTED");
  // Divine <-> Liam: accepted connection
  await connect(liam.id, divine.id, "ACCEPTED");
  // Sofia -> Divine: pending incoming request for Divine
  await connect(sofia.id, divine.id, "PENDING");
  // Divine -> Kenji: pending outgoing request from Divine
  await connect(divine.id, kenji.id, "PENDING");
  // Amara <-> Priya: accepted, unrelated to Divine, for discover variety
  await connect(amara.id, priya.id, "ACCEPTED");

  console.log(`Seeded ${users.length} users.`);
  console.log(`Demo login: divine.okafor@peerconnect.dev / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
