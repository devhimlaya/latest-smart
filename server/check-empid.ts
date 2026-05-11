import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  const teachers = await prisma.teacher.findMany({ include: { user: { select: { email: true } } }, take: 5 });
  teachers.forEach((t: any) => console.log(`id=${t.id} empId=${JSON.stringify(t.employeeId)} email=${t.user?.email}`));
  const miguel = await prisma.teacher.findFirst({ include: { user: true }, where: { user: { email: 'miguel.valdez@deped.edu.ph' } } }) as any;
  if (miguel) {
    console.log(`\nMiguel: employeeId=${JSON.stringify(miguel.employeeId)} type=${typeof miguel.employeeId}`);
  } else {
    console.log('\nMiguel NOT FOUND by email');
  }
  // Try matching ATLAS externalId=2359
  const byEmpId2359 = await prisma.teacher.findFirst({ where: { employeeId: '2359' } }) as any;
  console.log('Teacher with employeeId="2359":', byEmpId2359?.id ?? 'NOT FOUND');
  const byEmpId2359num = await prisma.teacher.findFirst({ where: { employeeId: 2359 as any } }) as any;
  console.log('Teacher with employeeId=2359 (num):', byEmpId2359num?.id ?? 'NOT FOUND');
  await prisma['$disconnect']();
}
main().catch(console.error);
