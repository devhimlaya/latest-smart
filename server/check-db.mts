import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
dotenv.config();
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) } as any);
const [u, t, s, sub, ca, st, adv] = await Promise.all([
  prisma.user.count(), prisma.teacher.count(), prisma.section.count(), prisma.subject.count(),
  prisma.classAssignment.count(), prisma.student.count(),
  prisma.section.count({ where: { adviserId: { not: null } } }),
]);
console.log(`Users: ${u} | Teachers: ${t} | Sections: ${s} | Subjects: ${sub}`);
console.log(`ClassAssignments: ${ca} | Students: ${st} | Sections with adviser: ${adv}`);
const sample = await prisma.user.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
sample.forEach(u2 => console.log(' -', u2.role, u2.username));
await prisma['$disconnect']();
