import "dotenv/config";
import { PrismaClient, Role, GradeLevel, SubjectType, Quarter, AuditAction, AuditSeverity } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// Filipino names for students
const firstNames = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena", "Miguel", "Sofia",
  "Antonio", "Isabella", "Francisco", "Gabriela", "Manuel", "Andrea", "Rafael", "Carmen",
  "Gabriel", "Patricia", "Diego", "Lucia", "Fernando", "Mariana", "Ricardo", "Valentina",
  "Luis", "Camila", "Andres", "Paula", "Daniel", "Daniela", "Jorge", "Victoria", "Marco",
  "Samantha", "Adrian", "Nicole", "Christian", "Alexandra", "Javier", "Katherine", "Paolo",
  "Michelle", "Kenneth", "Jasmine", "Mark", "Angela"
];

const lastNames = [
  "Santos", "Reyes", "Cruz", "Garcia", "Mendoza", "Torres", "Flores", "Gonzales", "Bautista",
  "Villanueva", "Ramos", "Aquino", "Castro", "Rivera", "Dela Cruz", "Francisco", "Hernandez",
  "Lopez", "Morales", "Pascual", "Perez", "Rosario", "Salvador", "Tan", "Mercado", "Navarro",
  "Ortega", "Padilla", "Quinto", "Ramirez", "Santiago", "Valdez", "Velasco", "Aguilar",
  "Bernal", "Cabrera", "Diaz", "Espinosa", "Fernandez", "Gutierrez", "Ibarra", "Jimenez"
];

function generateLRN(counter: number): string {
  // LRN format: 1234567890XX (12 digits)
  const paddedCounter = counter.toString().padStart(11, '0');
  return `1${paddedCounter}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Transmute to DepEd grading scale
function transmute(initial: number): number {
  if (initial >= 100) return 100;
  if (initial >= 98.40) return 99;
  if (initial >= 96.80) return 98;
  if (initial >= 95.20) return 97;
  if (initial >= 93.60) return 96;
  if (initial >= 92.00) return 95;
  if (initial >= 90.40) return 94;
  if (initial >= 88.80) return 93;
  if (initial >= 87.20) return 92;
  if (initial >= 85.60) return 91;
  if (initial >= 84.00) return 90;
  if (initial >= 82.40) return 89;
  if (initial >= 80.80) return 88;
  if (initial >= 79.20) return 87;
  if (initial >= 77.60) return 86;
  if (initial >= 76.00) return 85;
  if (initial >= 74.40) return 84;
  if (initial >= 72.80) return 83;
  if (initial >= 71.20) return 82;
  if (initial >= 69.60) return 81;
  if (initial >= 68.00) return 80;
  if (initial >= 66.40) return 79;
  if (initial >= 64.80) return 78;
  if (initial >= 63.20) return 77;
  if (initial >= 61.60) return 76;
  if (initial >= 60.00) return 75;
  if (initial >= 56.00) return 74;
  if (initial >= 52.00) return 73;
  if (initial >= 48.00) return 72;
  if (initial >= 44.00) return 71;
  if (initial >= 40.00) return 70;
  if (initial >= 36.00) return 69;
  if (initial >= 32.00) return 68;
  if (initial >= 28.00) return 67;
  if (initial >= 24.00) return 66;
  if (initial >= 20.00) return 65;
  if (initial >= 16.00) return 64;
  if (initial >= 12.00) return 63;
  if (initial >= 8.00) return 62;
  if (initial >= 4.00) return 61;
  return 60;
}

async function main() {
  console.log("Starting seed...");

  // Clean up existing data to avoid conflicts
  console.log("Cleaning up existing data...");
  await prisma.auditLog.deleteMany({});
  await prisma.gradingConfig.deleteMany({});
  await prisma.systemSettings.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.classAssignment.deleteMany({});
  await prisma.section.deleteMany({});
  
  console.log("Creating new seed data...");

  // Hash passwords
  const saltRounds = 10;
  const teacherPassword = await bcrypt.hash("teacher123", saltRounds);
  const adminPassword = await bcrypt.hash("admin123", saltRounds);
  const registrarPassword = await bcrypt.hash("registrar123", saltRounds);

  // Create users - Teacher 1 (English - Advisory)
  const teacherUser = await prisma.user.upsert({
    where: { username: "teacher" },
    update: {
      firstName: "Sean Justin",
      lastName: "Roma",
      email: "sean.roma@school.edu.ph",
    },
    create: {
      username: "teacher",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Sean Justin",
      lastName: "Roma",
      email: "sean.roma@school.edu.ph",
    },
  });

  // Create Teacher 2 (Math)
  const teacher2User = await prisma.user.upsert({
    where: { username: "teacher2" },
    update: {
      firstName: "Maria",
      lastName: "Santos",
      email: "maria.santos@school.edu.ph",
    },
    create: {
      username: "teacher2",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Maria",
      lastName: "Santos",
      email: "maria.santos@school.edu.ph",
    },
  });

  // Create Teacher 3 (Science)
  const teacher3User = await prisma.user.upsert({
    where: { username: "teacher3" },
    update: {
      firstName: "Jose",
      lastName: "Reyes",
      email: "jose.reyes@school.edu.ph",
    },
    create: {
      username: "teacher3",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Jose",
      lastName: "Reyes",
      email: "jose.reyes@school.edu.ph",
    },
  });

  // Create Teacher 4 (Filipino)
  const teacher4User = await prisma.user.upsert({
    where: { username: "teacher4" },
    update: {
      firstName: "Carmen",
      lastName: "Dela Cruz",
      email: "carmen.delacruz@school.edu.ph",
    },
    create: {
      username: "teacher4",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Carmen",
      lastName: "Dela Cruz",
      email: "carmen.delacruz@school.edu.ph",
    },
  });

  // Create Teacher 5 (Araling Panlipunan)
  const teacher5User = await prisma.user.upsert({
    where: { username: "teacher5" },
    update: {
      firstName: "Roberto",
      lastName: "Gonzales",
      email: "roberto.gonzales@school.edu.ph",
    },
    create: {
      username: "teacher5",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Roberto",
      lastName: "Gonzales",
      email: "roberto.gonzales@school.edu.ph",
    },
  });

  // Create Teacher 6 (MAPEH)
  const teacher6User = await prisma.user.upsert({
    where: { username: "teacher6" },
    update: {
      firstName: "Patricia",
      lastName: "Ramos",
      email: "patricia.ramos@school.edu.ph",
    },
    create: {
      username: "teacher6",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Patricia",
      lastName: "Ramos",
      email: "patricia.ramos@school.edu.ph",
    },
  });

  // Create Teacher 7 (TLE)
  const teacher7User = await prisma.user.upsert({
    where: { username: "teacher7" },
    update: {
      firstName: "Miguel",
      lastName: "Torres",
      email: "miguel.torres@school.edu.ph",
    },
    create: {
      username: "teacher7",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Miguel",
      lastName: "Torres",
      email: "miguel.torres@school.edu.ph",
    },
  });

  // Create Teacher 8 (ESP)
  const teacher8User = await prisma.user.upsert({
    where: { username: "teacher8" },
    update: {
      firstName: "Sofia",
      lastName: "Bautista",
      email: "sofia.bautista@school.edu.ph",
    },
    create: {
      username: "teacher8",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Sofia",
      lastName: "Bautista",
      email: "sofia.bautista@school.edu.ph",
    },
  });

  // Create Adviser Teachers (Grade 8-10 advisers)
  const teacher9User = await prisma.user.upsert({
    where: { username: "teacher9" },
    update: {
      firstName: "Antonio",
      lastName: "Mercado",
      email: "antonio.mercado@school.edu.ph",
    },
    create: {
      username: "teacher9",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Antonio",
      lastName: "Mercado",
      email: "antonio.mercado@school.edu.ph",
    },
  });

  const teacher10User = await prisma.user.upsert({
    where: { username: "teacher10" },
    update: {
      firstName: "Elena",
      lastName: "Valdez",
      email: "elena.valdez@school.edu.ph",
    },
    create: {
      username: "teacher10",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Elena",
      lastName: "Valdez",
      email: "elena.valdez@school.edu.ph",
    },
  });

  const teacher11User = await prisma.user.upsert({
    where: { username: "teacher11" },
    update: {
      firstName: "Rafael",
      lastName: "Navarro",
      email: "rafael.navarro@school.edu.ph",
    },
    create: {
      username: "teacher11",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Rafael",
      lastName: "Navarro",
      email: "rafael.navarro@school.edu.ph",
    },
  });

  const teacher12User = await prisma.user.upsert({
    where: { username: "teacher12" },
    update: {
      firstName: "Gabriela",
      lastName: "Ortega",
      email: "gabriela.ortega@school.edu.ph",
    },
    create: {
      username: "teacher12",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Gabriela",
      lastName: "Ortega",
      email: "gabriela.ortega@school.edu.ph",
    },
  });

  const teacher13User = await prisma.user.upsert({
    where: { username: "teacher13" },
    update: {
      firstName: "Fernando",
      lastName: "Padilla",
      email: "fernando.padilla@school.edu.ph",
    },
    create: {
      username: "teacher13",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Fernando",
      lastName: "Padilla",
      email: "fernando.padilla@school.edu.ph",
    },
  });

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
    },
  });

  await prisma.user.upsert({
    where: { username: "registrar" },
    update: {},
    create: {
      username: "registrar",
      password: registrarPassword,
      role: Role.REGISTRAR,
      firstName: "Registrar",
      lastName: "User",
    },
  });

  // Create Teacher profiles
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeId: "EMP-2024-001",
      specialization: "English",
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacher2User.id },
    update: {},
    create: {
      userId: teacher2User.id,
      employeeId: "EMP-2024-002",
      specialization: "Mathematics",
    },
  });

  const teacher3 = await prisma.teacher.upsert({
    where: { userId: teacher3User.id },
    update: {},
    create: {
      userId: teacher3User.id,
      employeeId: "EMP-2024-003",
      specialization: "Science",
    },
  });

  const teacher4 = await prisma.teacher.upsert({
    where: { userId: teacher4User.id },
    update: {},
    create: {
      userId: teacher4User.id,
      employeeId: "EMP-2024-004",
      specialization: "Filipino",
    },
  });

  const teacher5 = await prisma.teacher.upsert({
    where: { userId: teacher5User.id },
    update: {},
    create: {
      userId: teacher5User.id,
      employeeId: "EMP-2024-005",
      specialization: "Araling Panlipunan",
    },
  });

  const teacher6 = await prisma.teacher.upsert({
    where: { userId: teacher6User.id },
    update: {},
    create: {
      userId: teacher6User.id,
      employeeId: "EMP-2024-006",
      specialization: "MAPEH",
    },
  });

  const teacher7 = await prisma.teacher.upsert({
    where: { userId: teacher7User.id },
    update: {},
    create: {
      userId: teacher7User.id,
      employeeId: "EMP-2024-007",
      specialization: "TLE",
    },
  });

  const teacher8 = await prisma.teacher.upsert({
    where: { userId: teacher8User.id },
    update: {},
    create: {
      userId: teacher8User.id,
      employeeId: "EMP-2024-008",
      specialization: "ESP",
    },
  });

  const teacher9 = await prisma.teacher.upsert({
    where: { userId: teacher9User.id },
    update: {},
    create: {
      userId: teacher9User.id,
      employeeId: "EMP-2024-009",
      specialization: "Grade 8 Adviser",
    },
  });

  const teacher10 = await prisma.teacher.upsert({
    where: { userId: teacher10User.id },
    update: {},
    create: {
      userId: teacher10User.id,
      employeeId: "EMP-2024-010",
      specialization: "Grade 9 Adviser",
    },
  });

  const teacher11 = await prisma.teacher.upsert({
    where: { userId: teacher11User.id },
    update: {},
    create: {
      userId: teacher11User.id,
      employeeId: "EMP-2024-011",
      specialization: "Grade 9 Adviser",
    },
  });

  const teacher12 = await prisma.teacher.upsert({
    where: { userId: teacher12User.id },
    update: {},
    create: {
      userId: teacher12User.id,
      employeeId: "EMP-2024-012",
      specialization: "Grade 10 Adviser",
    },
  });

  const teacher13 = await prisma.teacher.upsert({
    where: { userId: teacher13User.id },
    update: {},
    create: {
      userId: teacher13User.id,
      employeeId: "EMP-2024-013",
      specialization: "Grade 10 Adviser",
    },
  });

  // Create Subjects for all grade levels
  const subjects = [
    // Grade 7
    { code: "ENG7", name: "English 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MATH7", name: "Mathematics 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "SCI7", name: "Science 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "FIL7", name: "Filipino 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "AP7", name: "Araling Panlipunan 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MAPEH7", name: "MAPEH 7", type: SubjectType.PE_HEALTH, ww: 20, pt: 60, qa: 20 },
    { code: "TLE7", name: "TLE 7", type: SubjectType.TLE, ww: 20, pt: 60, qa: 20 },
    { code: "ESP7", name: "Edukasyon sa Pagpapakatao 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    // Grade 8
    { code: "ENG8", name: "English 8", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MATH8", name: "Mathematics 8", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "SCI8", name: "Science 8", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    // Grade 9
    { code: "ENG9", name: "English 9", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MATH9", name: "Mathematics 9", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "SCI9", name: "Science 9", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    // Grade 10
    { code: "ENG10", name: "English 10", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MATH10", name: "Mathematics 10", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "SCI10", name: "Science 10", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: {
        code: subject.code,
        name: subject.name,
        type: subject.type,
        writtenWorkWeight: subject.ww,
        perfTaskWeight: subject.pt,
        quarterlyAssessWeight: subject.qa,
      },
    });
  }

  // Get created subjects
  const english7 = await prisma.subject.findUnique({ where: { code: "ENG7" } });
  const math7 = await prisma.subject.findUnique({ where: { code: "MATH7" } });
  const science7 = await prisma.subject.findUnique({ where: { code: "SCI7" } });
  const filipino7 = await prisma.subject.findUnique({ where: { code: "FIL7" } });
  const ap7 = await prisma.subject.findUnique({ where: { code: "AP7" } });
  const mapeh7 = await prisma.subject.findUnique({ where: { code: "MAPEH7" } });
  const tle7 = await prisma.subject.findUnique({ where: { code: "TLE7" } });
  const esp7 = await prisma.subject.findUnique({ where: { code: "ESP7" } });
  
  const english8 = await prisma.subject.findUnique({ where: { code: "ENG8" } });
  const math8 = await prisma.subject.findUnique({ where: { code: "MATH8" } });
  const science8 = await prisma.subject.findUnique({ where: { code: "SCI8" } });
  
  const english9 = await prisma.subject.findUnique({ where: { code: "ENG9" } });
  const math9 = await prisma.subject.findUnique({ where: { code: "MATH9" } });
  const science9 = await prisma.subject.findUnique({ where: { code: "SCI9" } });
  
  const english10 = await prisma.subject.findUnique({ where: { code: "ENG10" } });
  const math10 = await prisma.subject.findUnique({ where: { code: "MATH10" } });
  const science10 = await prisma.subject.findUnique({ where: { code: "SCI10" } });

  // Create Sections for Grades 7-10
  const sections = [
    // Grade 7
    { name: "Einstein", gradeLevel: GradeLevel.GRADE_7, isAdvisory: true },
    { name: "Newton", gradeLevel: GradeLevel.GRADE_7, isAdvisory: false },
    { name: "Gaius", gradeLevel: GradeLevel.GRADE_7, isAdvisory: false },
    // Grade 8
    { name: "Rizal", gradeLevel: GradeLevel.GRADE_8, isAdvisory: false },
    { name: "Bonifacio", gradeLevel: GradeLevel.GRADE_8, isAdvisory: false },
    // Grade 9
    { name: "Mabini", gradeLevel: GradeLevel.GRADE_9, isAdvisory: false },
    { name: "Luna", gradeLevel: GradeLevel.GRADE_9, isAdvisory: false },
    // Grade 10
    { name: "Aguinaldo", gradeLevel: GradeLevel.GRADE_10, isAdvisory: false },
    { name: "Del Pilar", gradeLevel: GradeLevel.GRADE_10, isAdvisory: false },
  ];

  const schoolYear = "2025-2026";

  for (const section of sections) {
    await prisma.section.upsert({
      where: {
        name_gradeLevel_schoolYear: {
          name: section.name,
          gradeLevel: section.gradeLevel,
          schoolYear,
        },
      },
      update: {},
      create: {
        name: section.name,
        gradeLevel: section.gradeLevel,
        schoolYear,
      },
    });
  }

  // Assign advisers to sections
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher.id} WHERE name = 'Einstein' AND "gradeLevel" = 'GRADE_7'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher2.id} WHERE name = 'Newton' AND "gradeLevel" = 'GRADE_7'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher3.id} WHERE name = 'Rizal' AND "gradeLevel" = 'GRADE_8'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher9.id} WHERE name = 'Bonifacio' AND "gradeLevel" = 'GRADE_8'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher10.id} WHERE name = 'Mabini' AND "gradeLevel" = 'GRADE_9'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher11.id} WHERE name = 'Luna' AND "gradeLevel" = 'GRADE_9'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher12.id} WHERE name = 'Aguinaldo' AND "gradeLevel" = 'GRADE_10'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
  await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher13.id} WHERE name = 'Del Pilar' AND "gradeLevel" = 'GRADE_10'::"GradeLevel" AND "schoolYear" = ${schoolYear}`;

  // Get created sections
  const sectionEinstein = await prisma.section.findFirst({
    where: { name: "Einstein", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionNewton = await prisma.section.findFirst({
    where: { name: "Newton", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionGaius = await prisma.section.findFirst({
    where: { name: "Gaius", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionRizal = await prisma.section.findFirst({
    where: { name: "Rizal", gradeLevel: GradeLevel.GRADE_8 },
  });
  const sectionBonifacio = await prisma.section.findFirst({
    where: { name: "Bonifacio", gradeLevel: GradeLevel.GRADE_8 },
  });
  const sectionMabini = await prisma.section.findFirst({
    where: { name: "Mabini", gradeLevel: GradeLevel.GRADE_9 },
  });
  const sectionLuna = await prisma.section.findFirst({
    where: { name: "Luna", gradeLevel: GradeLevel.GRADE_9 },
  });
  const sectionAguinaldo = await prisma.section.findFirst({
    where: { name: "Aguinaldo", gradeLevel: GradeLevel.GRADE_10 },
  });
  const sectionDelPilar = await prisma.section.findFirst({
    where: { name: "Del Pilar", gradeLevel: GradeLevel.GRADE_10 },
  });

  // Create Class Assignments
  // Teacher 1 (Sean Justin Roma) - English for ALL sections
  // Teacher 2 (Maria Santos) - Math for ALL sections
  // Teacher 3 (Jose Reyes) - Science for ALL sections
  // Teachers 4-8 - Other subjects for Grade 7 sections only
  
  const classAssignments = [
    // GRADE 7 - Einstein, Newton & Gaius
    // Teacher 1 - English
    { teacherId: teacher.id, subjectId: english7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher.id, subjectId: english7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher.id, subjectId: english7!.id, sectionId: sectionGaius!.id },
    // Teacher 2 - Math
    { teacherId: teacher2.id, subjectId: math7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher2.id, subjectId: math7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher2.id, subjectId: math7!.id, sectionId: sectionGaius!.id },
    // Teacher 3 - Science
    { teacherId: teacher3.id, subjectId: science7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher3.id, subjectId: science7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher3.id, subjectId: science7!.id, sectionId: sectionGaius!.id },
    // Teacher 4 - Filipino
    { teacherId: teacher4.id, subjectId: filipino7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher4.id, subjectId: filipino7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher4.id, subjectId: filipino7!.id, sectionId: sectionGaius!.id },
    // Teacher 5 - Araling Panlipunan
    { teacherId: teacher5.id, subjectId: ap7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher5.id, subjectId: ap7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher5.id, subjectId: ap7!.id, sectionId: sectionGaius!.id },
    // Teacher 6 - MAPEH
    { teacherId: teacher6.id, subjectId: mapeh7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher6.id, subjectId: mapeh7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher6.id, subjectId: mapeh7!.id, sectionId: sectionGaius!.id },
    // Teacher 7 - TLE
    { teacherId: teacher7.id, subjectId: tle7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher7.id, subjectId: tle7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher7.id, subjectId: tle7!.id, sectionId: sectionGaius!.id },
    // Teacher 8 - ESP
    { teacherId: teacher8.id, subjectId: esp7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher8.id, subjectId: esp7!.id, sectionId: sectionNewton!.id },
    { teacherId: teacher8.id, subjectId: esp7!.id, sectionId: sectionGaius!.id },
    
    // GRADE 8 - Rizal & Bonifacio
    // Teacher 1 - English 8
    { teacherId: teacher.id, subjectId: english8!.id, sectionId: sectionRizal!.id },
    { teacherId: teacher.id, subjectId: english8!.id, sectionId: sectionBonifacio!.id },
    // Teacher 2 - Math 8
    { teacherId: teacher2.id, subjectId: math8!.id, sectionId: sectionRizal!.id },
    { teacherId: teacher2.id, subjectId: math8!.id, sectionId: sectionBonifacio!.id },
    // Teacher 3 - Science 8
    { teacherId: teacher3.id, subjectId: science8!.id, sectionId: sectionRizal!.id },
    { teacherId: teacher3.id, subjectId: science8!.id, sectionId: sectionBonifacio!.id },
    
    // GRADE 9 - Mabini & Luna
    // Teacher 1 - English 9
    { teacherId: teacher.id, subjectId: english9!.id, sectionId: sectionMabini!.id },
    { teacherId: teacher.id, subjectId: english9!.id, sectionId: sectionLuna!.id },
    // Teacher 2 - Math 9
    { teacherId: teacher2.id, subjectId: math9!.id, sectionId: sectionMabini!.id },
    { teacherId: teacher2.id, subjectId: math9!.id, sectionId: sectionLuna!.id },
    // Teacher 3 - Science 9
    { teacherId: teacher3.id, subjectId: science9!.id, sectionId: sectionMabini!.id },
    { teacherId: teacher3.id, subjectId: science9!.id, sectionId: sectionLuna!.id },
    
    // GRADE 10 - Aguinaldo & Del Pilar
    // Teacher 1 - English 10
    { teacherId: teacher.id, subjectId: english10!.id, sectionId: sectionAguinaldo!.id },
    { teacherId: teacher.id, subjectId: english10!.id, sectionId: sectionDelPilar!.id },
    // Teacher 2 - Math 10
    { teacherId: teacher2.id, subjectId: math10!.id, sectionId: sectionAguinaldo!.id },
    { teacherId: teacher2.id, subjectId: math10!.id, sectionId: sectionDelPilar!.id },
    // Teacher 3 - Science 10
    { teacherId: teacher3.id, subjectId: science10!.id, sectionId: sectionAguinaldo!.id },
    { teacherId: teacher3.id, subjectId: science10!.id, sectionId: sectionDelPilar!.id },
  ];

  for (const assignment of classAssignments) {
    await prisma.classAssignment.upsert({
      where: {
        teacherId_subjectId_sectionId_schoolYear: {
          teacherId: assignment.teacherId,
          subjectId: assignment.subjectId,
          sectionId: assignment.sectionId,
          schoolYear,
        },
      },
      update: {},
      create: {
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        sectionId: assignment.sectionId,
        schoolYear,
      },
    });
  }

  // Create first student for Einstein section (will have grades in all subjects)
  const firstStudent = await prisma.student.create({
    data: {
      lrn: generateLRN(1),
      firstName: "Maria",
      middleName: "Santos",
      lastName: "Reyes",
      gender: "Female",
      birthDate: new Date(2012, 5, 15),
      address: "Brgy. San Jose, Municipality, Province",
      guardianName: "Juan Reyes",
      guardianContact: "09171234567",
    },
  });

  // Enroll first student in Einstein section
  await prisma.enrollment.create({
    data: {
      studentId: firstStudent.id,
      sectionId: sectionEinstein!.id,
      schoolYear,
      status: "ENROLLED",
    },
  });

  // Create 39-44 more students for Einstein section (total 40-45)
  let studentCounter = 2;
  const einsteinCount = Math.floor(Math.random() * 6) + 39; // 39-44
  
  for (let i = 0; i < einsteinCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2011 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionEinstein!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Newton section
  const newtonCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < newtonCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2011 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionNewton!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Rizal section (Grade 8)
  const rizalCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < rizalCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2010 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionRizal!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Bonifacio section (Grade 8)
  const bonifacioCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < bonifacioCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2010 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionBonifacio!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Mabini section (Grade 9)
  const mabiniCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < mabiniCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2009 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionMabini!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Luna section (Grade 9)
  const lunaCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < lunaCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2009 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionLuna!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Aguinaldo section (Grade 10)
  const aguinaldoCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < aguinaldoCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2008 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionAguinaldo!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Create 40-45 students for Del Pilar section (Grade 10)
  const delPilarCount = Math.floor(Math.random() * 6) + 40; // 40-45
  for (let i = 0; i < delPilarCount; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const lrn = generateLRN(studentCounter++);
    const gender = Math.random() > 0.5 ? "Male" : "Female";

    const student = await prisma.student.create({
      data: {
        lrn,
        firstName,
        middleName: randomElement(lastNames),
        lastName,
        gender,
        birthDate: new Date(2008 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
        guardianName: `${randomElement(firstNames)} ${lastName}`,
        guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: sectionDelPilar!.id,
        schoolYear,
        status: "ENROLLED",
      },
    });
  }

  // Generate grades for all students in all class assignments
  console.log("Generating Q1 grades for all students...");

  const allClassAssignments = await prisma.classAssignment.findMany({
    include: {
      section: true,
      subject: true,
    },
  });

  for (const classAssignment of allClassAssignments) {
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        sectionId: classAssignment.sectionId,
        schoolYear,
      },
      include: { student: true },
    });

    for (const enrollment of enrollments) {
      // Generate realistic scores with some failing students
      // 85% students pass (75-98%), 15% students struggle or fail (40-74%)
      const performanceLevel = Math.random();
      const isStruggling = performanceLevel < 0.15; // 15% of students
      const hasIncomplete = performanceLevel < 0.05; // 5% have incomplete work
      
      let wwScores, ptScores, qaScore;
      
      if (hasIncomplete) {
        // Student with incomplete work (missing some assignments)
        wwScores = [
          { name: "Quiz 1", score: Math.round(10 + Math.random() * 8), maxScore: 20 },
          { name: "Quiz 2", score: Math.round(8 + Math.random() * 10), maxScore: 20 },
          { name: "Quiz 3", score: 0, maxScore: 20 }, // Missing
          { name: "Quiz 4", score: Math.round(12 + Math.random() * 6), maxScore: 20 },
          { name: "Quiz 5", score: 0, maxScore: 20 }, // Missing
        ];
        ptScores = [
          { name: "Project 1", score: Math.round(25 + Math.random() * 15), maxScore: 50 },
          { name: "Project 2", score: 0, maxScore: 50 }, // Missing
          { name: "Project 3", score: Math.round(20 + Math.random() * 20), maxScore: 50 },
        ];
        qaScore = Math.round(45 + Math.random() * 25); // 45-70
      } else if (isStruggling) {
        // Struggling student with low scores
        wwScores = [
          { name: "Quiz 1", score: Math.round(8 + Math.random() * 8), maxScore: 20 },
          { name: "Quiz 2", score: Math.round(7 + Math.random() * 9), maxScore: 20 },
          { name: "Quiz 3", score: Math.round(9 + Math.random() * 8), maxScore: 20 },
          { name: "Quiz 4", score: Math.round(10 + Math.random() * 7), maxScore: 20 },
          { name: "Quiz 5", score: Math.round(8 + Math.random() * 9), maxScore: 20 },
        ];
        ptScores = [
          { name: "Project 1", score: Math.round(20 + Math.random() * 18), maxScore: 50 },
          { name: "Project 2", score: Math.round(22 + Math.random() * 16), maxScore: 50 },
          { name: "Project 3", score: Math.round(25 + Math.random() * 15), maxScore: 50 },
        ];
        qaScore = Math.round(40 + Math.random() * 30); // 40-70
      } else {
        // Regular passing student
        wwScores = [
          { name: "Quiz 1", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
          { name: "Quiz 2", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
          { name: "Quiz 3", score: Math.round(13 + Math.random() * 7), maxScore: 20 },
          { name: "Quiz 4", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
          { name: "Quiz 5", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
        ];
        ptScores = [
          { name: "Project 1", score: Math.round(35 + Math.random() * 15), maxScore: 50 },
          { name: "Project 2", score: Math.round(38 + Math.random() * 12), maxScore: 50 },
          { name: "Project 3", score: Math.round(40 + Math.random() * 10), maxScore: 50 },
        ];
        qaScore = Math.round(70 + Math.random() * 30); // 70-100
      }
      
      const qaMax = 100;

      // Calculate weighted scores
      const wwTotal = wwScores.reduce((sum, s) => sum + s.score, 0);
      const wwMaxTotal = wwScores.reduce((sum, s) => sum + s.maxScore, 0);
      const wwPS = (wwTotal / wwMaxTotal) * 100;

      const ptTotal = ptScores.reduce((sum, s) => sum + s.score, 0);
      const ptMaxTotal = ptScores.reduce((sum, s) => sum + s.maxScore, 0);
      const ptPS = (ptTotal / ptMaxTotal) * 100;

      const qaPS = (qaScore / qaMax) * 100;

      const wwWeight = classAssignment.subject.writtenWorkWeight;
      const ptWeight = classAssignment.subject.perfTaskWeight;
      const qaWeight = classAssignment.subject.quarterlyAssessWeight;

      const initialGrade = (wwPS * wwWeight / 100) + (ptPS * ptWeight / 100) + (qaPS * qaWeight / 100);
      const quarterlyGrade = transmute(initialGrade);
      
      // Determine remarks based on grade and completeness
      let remarks;
      if (hasIncomplete && initialGrade < 60) {
        remarks = "INC"; // Incomplete - too many missing requirements
      } else if (quarterlyGrade >= 75) {
        remarks = "Passed";
      } else {
        remarks = "Failed";
      }

      await prisma.grade.upsert({
        where: {
          studentId_classAssignmentId_quarter: {
            studentId: enrollment.studentId,
            classAssignmentId: classAssignment.id,
            quarter: Quarter.Q1,
          },
        },
        update: {
          writtenWorkScores: wwScores,
          perfTaskScores: ptScores,
          quarterlyAssessScore: qaScore,
          quarterlyAssessMax: qaMax,
          writtenWorkPS: Math.round(wwPS * 100) / 100,
          perfTaskPS: Math.round(ptPS * 100) / 100,
          quarterlyAssessPS: Math.round(qaPS * 100) / 100,
          initialGrade: Math.round(initialGrade * 100) / 100,
          quarterlyGrade,
          remarks,
        },
        create: {
          studentId: enrollment.studentId,
          classAssignmentId: classAssignment.id,
          quarter: Quarter.Q1,
          writtenWorkScores: wwScores,
          perfTaskScores: ptScores,
          quarterlyAssessScore: qaScore,
          quarterlyAssessMax: qaMax,
          writtenWorkPS: Math.round(wwPS * 100) / 100,
          perfTaskPS: Math.round(ptPS * 100) / 100,
          quarterlyAssessPS: Math.round(qaPS * 100) / 100,
          initialGrade: Math.round(initialGrade * 100) / 100,
          quarterlyGrade,
          remarks,
        },
      });
    }

    console.log(`  - Generated grades for ${classAssignment.section.name} - ${classAssignment.subject.name}`);
  }

  // Generate Q2, Q3, and Q4 grades for all students
  console.log("\nGenerating Q2, Q3, and Q4 grades for all students...");

  for (const classAssignment of allClassAssignments) {
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        sectionId: classAssignment.sectionId,
        schoolYear,
      },
      include: { student: true },
    });

    for (const enrollment of enrollments) {
      // Get Q1 grade to maintain consistency
      const q1Grade = await prisma.grade.findUnique({
        where: {
          studentId_classAssignmentId_quarter: {
            studentId: enrollment.studentId,
            classAssignmentId: classAssignment.id,
            quarter: Quarter.Q1,
          },
        },
      });

      // Generate grades for Q2, Q3, Q4
      for (const quarter of [Quarter.Q2, Quarter.Q3, Quarter.Q4]) {
        // Student performance tends to improve or maintain throughout the year
        // Use Q1 as baseline and add slight variation
        const performanceLevel = Math.random();
        const wasStruggling = q1Grade && q1Grade.quarterlyGrade !== null && q1Grade.quarterlyGrade < 75;
        const wasIncomplete = q1Grade && q1Grade.remarks === "INC";
        
        // 70% chance to improve, 20% maintain, 10% decline
        const trend = Math.random();
        const improvement = trend < 0.7 ? (Math.random() * 10 - 5) : trend < 0.9 ? 0 : -(Math.random() * 5);
        
        let wwScores, ptScores, qaScore;
        
        if (wasIncomplete && Math.random() < 0.3) {
          // 30% chance incomplete student remains incomplete
          wwScores = [
            { name: "Quiz 1", score: Math.round(10 + Math.random() * 8), maxScore: 20 },
            { name: "Quiz 2", score: Math.round(8 + Math.random() * 10), maxScore: 20 },
            { name: "Quiz 3", score: 0, maxScore: 20 },
            { name: "Quiz 4", score: Math.round(12 + Math.random() * 6), maxScore: 20 },
            { name: "Quiz 5", score: 0, maxScore: 20 },
          ];
          ptScores = [
            { name: "Project 1", score: Math.round(25 + Math.random() * 15), maxScore: 50 },
            { name: "Project 2", score: 0, maxScore: 50 },
            { name: "Project 3", score: Math.round(20 + Math.random() * 20), maxScore: 50 },
          ];
          qaScore = Math.round(45 + Math.random() * 25);
        } else if (wasStruggling) {
          // Struggling students may improve
          const base = wasIncomplete ? 8 : 10;
          wwScores = [
            { name: "Quiz 1", score: Math.round(base + Math.random() * 8 + improvement), maxScore: 20 },
            { name: "Quiz 2", score: Math.round(base + Math.random() * 9 + improvement), maxScore: 20 },
            { name: "Quiz 3", score: Math.round(base + Math.random() * 8 + improvement), maxScore: 20 },
            { name: "Quiz 4", score: Math.round(base + Math.random() * 7 + improvement), maxScore: 20 },
            { name: "Quiz 5", score: Math.round(base + Math.random() * 9 + improvement), maxScore: 20 },
          ];
          ptScores = [
            { name: "Project 1", score: Math.round(20 + Math.random() * 18 + improvement * 2), maxScore: 50 },
            { name: "Project 2", score: Math.round(22 + Math.random() * 16 + improvement * 2), maxScore: 50 },
            { name: "Project 3", score: Math.round(25 + Math.random() * 15 + improvement * 2), maxScore: 50 },
          ];
          qaScore = Math.round(Math.min(100, Math.max(40, 50 + Math.random() * 30 + improvement * 3)));
        } else {
          // Regular students maintain or slightly improve
          wwScores = [
            { name: "Quiz 1", score: Math.round(Math.min(20, 15 + Math.random() * 5 + improvement * 0.3)), maxScore: 20 },
            { name: "Quiz 2", score: Math.round(Math.min(20, 14 + Math.random() * 6 + improvement * 0.3)), maxScore: 20 },
            { name: "Quiz 3", score: Math.round(Math.min(20, 13 + Math.random() * 7 + improvement * 0.3)), maxScore: 20 },
            { name: "Quiz 4", score: Math.round(Math.min(20, 15 + Math.random() * 5 + improvement * 0.3)), maxScore: 20 },
            { name: "Quiz 5", score: Math.round(Math.min(20, 14 + Math.random() * 6 + improvement * 0.3)), maxScore: 20 },
          ];
          ptScores = [
            { name: "Project 1", score: Math.round(Math.min(50, 35 + Math.random() * 15 + improvement * 0.5)), maxScore: 50 },
            { name: "Project 2", score: Math.round(Math.min(50, 38 + Math.random() * 12 + improvement * 0.5)), maxScore: 50 },
            { name: "Project 3", score: Math.round(Math.min(50, 40 + Math.random() * 10 + improvement * 0.5)), maxScore: 50 },
          ];
          qaScore = Math.round(Math.min(100, Math.max(0, 70 + Math.random() * 30 + improvement)));
        }
        
        const qaMax = 100;

        // Calculate weighted scores
        const wwTotal = wwScores.reduce((sum, s) => sum + s.score, 0);
        const wwMaxTotal = wwScores.reduce((sum, s) => sum + s.maxScore, 0);
        const wwPS = (wwTotal / wwMaxTotal) * 100;

        const ptTotal = ptScores.reduce((sum, s) => sum + s.score, 0);
        const ptMaxTotal = ptScores.reduce((sum, s) => sum + s.maxScore, 0);
        const ptPS = (ptTotal / ptMaxTotal) * 100;

        const qaPS = (qaScore / qaMax) * 100;

        const wwWeight = classAssignment.subject.writtenWorkWeight;
        const ptWeight = classAssignment.subject.perfTaskWeight;
        const qaWeight = classAssignment.subject.quarterlyAssessWeight;

        const initialGrade = (wwPS * wwWeight / 100) + (ptPS * ptWeight / 100) + (qaPS * qaWeight / 100);
        const quarterlyGrade = transmute(initialGrade);
        
        let remarks;
        if (wasIncomplete && Math.random() < 0.3 && initialGrade < 60) {
          remarks = "INC";
        } else if (quarterlyGrade >= 75) {
          remarks = "Passed";
        } else {
          remarks = "Failed";
        }

        await prisma.grade.upsert({
          where: {
            studentId_classAssignmentId_quarter: {
              studentId: enrollment.studentId,
              classAssignmentId: classAssignment.id,
              quarter: quarter,
            },
          },
          update: {
            writtenWorkScores: wwScores,
            perfTaskScores: ptScores,
            quarterlyAssessScore: qaScore,
            quarterlyAssessMax: qaMax,
            writtenWorkPS: Math.round(wwPS * 100) / 100,
            perfTaskPS: Math.round(ptPS * 100) / 100,
            quarterlyAssessPS: Math.round(qaPS * 100) / 100,
            initialGrade: Math.round(initialGrade * 100) / 100,
            quarterlyGrade,
            remarks,
          },
          create: {
            studentId: enrollment.studentId,
            classAssignmentId: classAssignment.id,
            quarter: quarter,
            writtenWorkScores: wwScores,
            perfTaskScores: ptScores,
            quarterlyAssessScore: qaScore,
            quarterlyAssessMax: qaMax,
            writtenWorkPS: Math.round(wwPS * 100) / 100,
            perfTaskPS: Math.round(ptPS * 100) / 100,
            quarterlyAssessPS: Math.round(qaPS * 100) / 100,
            initialGrade: Math.round(initialGrade * 100) / 100,
            quarterlyGrade,
            remarks,
          },
        });
      }
    }

    console.log(`  - Generated Q2-Q4 grades for ${classAssignment.section.name} - ${classAssignment.subject.name}`);
  }

  // ============================================
  // ADMIN MODELS SEEDING
  // ============================================
  
  console.log("\nSeeding admin models...");

  // Create System Settings
  await prisma.systemSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      schoolName: "Hinigaran National High School",
      schoolId: "300847",
      division: "Division of Silay",
      region: "Region VI - Western Visayas",
      address: "Hinigaran, Negros Occidental",
      contactNumber: "",
      email: "",
      currentSchoolYear: "2025-2026",
      currentQuarter: Quarter.Q1,
      primaryColor: "#10b981",
      secondaryColor: "#34d399",
      accentColor: "#6ee7b7",
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChar: true,
    },
  });
  console.log("  - Created default SystemSettings for Hinigaran National High School");

  // Create Grading Configurations
  const gradingConfigs = [
    { subjectType: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { subjectType: SubjectType.PE_HEALTH, ww: 20, pt: 60, qa: 20 },
    { subjectType: SubjectType.MAPEH, ww: 20, pt: 60, qa: 20 },
    { subjectType: SubjectType.TLE, ww: 20, pt: 60, qa: 20 },
  ];

  for (const config of gradingConfigs) {
    await prisma.gradingConfig.upsert({
      where: { subjectType: config.subjectType },
      update: {},
      create: {
        subjectType: config.subjectType,
        writtenWorkWeight: config.ww,
        performanceTaskWeight: config.pt,
        quarterlyAssessWeight: config.qa,
        isDepEdDefault: true,
      },
    });
  }
  console.log("  - Created default GradingConfigs (4 subject types)");

  // Create sample Audit Logs
  const now = new Date();
  const adminUser = await prisma.user.findUnique({ where: { username: "admin" } });
  const registrarUser = await prisma.user.findUnique({ where: { username: "registrar" } });
  
  const sampleLogs = [
    {
      action: AuditAction.CONFIG,
      userName: "Admin",
      userRole: "ADMIN",
      userId: adminUser?.id,
      target: "System Settings",
      targetType: "Config",
      details: "Updated academic year settings to S.Y. 2025-2026",
      ipAddress: "192.168.1.1",
      severity: AuditSeverity.CRITICAL,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      action: AuditAction.CREATE,
      userName: "Admin",
      userRole: "ADMIN",
      userId: adminUser?.id,
      target: "User Account",
      targetType: "User",
      details: "Created new teacher account: Sofia Bautista",
      ipAddress: "192.168.1.1",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30),
    },
    {
      action: AuditAction.CONFIG,
      userName: "Admin",
      userRole: "ADMIN",
      userId: adminUser?.id,
      target: "Grading Weights",
      targetType: "Config",
      details: "Updated MAPEH grading weights: WW 20%, PT 60%, QA 20%",
      ipAddress: "192.168.1.1",
      severity: AuditSeverity.CRITICAL,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      action: AuditAction.LOGIN,
      userName: "Registrar",
      userRole: "REGISTRAR",
      userId: registrarUser?.id,
      target: "System",
      targetType: "Auth",
      details: "Successful login from Chrome on Windows",
      ipAddress: "192.168.1.102",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8), // 8 hours ago
    },
    {
      action: AuditAction.CREATE,
      userName: "Registrar",
      userRole: "REGISTRAR",
      userId: registrarUser?.id,
      target: "Enrollment",
      targetType: "Student",
      details: "New enrollment: Maria Reyes - Grade 7 Einstein",
      ipAddress: "192.168.1.102",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6), // 6 hours ago
    },
    {
      action: AuditAction.UPDATE,
      userName: "Sean Justin Roma",
      userRole: "TEACHER",
      userId: teacherUser.id,
      target: "Student Grades",
      targetType: "Grades",
      details: "Updated Q1 grades for English 7 - Einstein section (42 students)",
      ipAddress: "192.168.1.105",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
    },
    {
      action: AuditAction.UPDATE,
      userName: "Maria Santos",
      userRole: "TEACHER",
      userId: teacher2User.id,
      target: "Class Record",
      targetType: "Grades",
      details: "Modified Written Work scores for Math 7 - Newton section",
      ipAddress: "192.168.1.108",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      action: AuditAction.LOGIN,
      userName: "Admin",
      userRole: "ADMIN",
      userId: adminUser?.id,
      target: "System",
      targetType: "Auth",
      details: "Successful login from admin terminal",
      ipAddress: "192.168.1.1",
      severity: AuditSeverity.INFO,
      createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 mins ago
    },
  ];

  for (const log of sampleLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }
  console.log("  - Created sample AuditLogs (8 entries)");

  console.log("\nSeed completed!");
  console.log("Created users:");
  console.log("  - Teacher 1: username='teacher', password='teacher123' (Sean Justin Roma - English, Adviser: Einstein)");
  console.log("  - Teacher 2: username='teacher2', password='teacher123' (Maria Santos - Mathematics, Adviser: Newton)");
  console.log("  - Teacher 3: username='teacher3', password='teacher123' (Jose Reyes - Science, Adviser: Rizal)");
  console.log("  - Teacher 4: username='teacher4', password='teacher123' (Carmen Dela Cruz - Filipino)");
  console.log("  - Teacher 5: username='teacher5', password='teacher123' (Roberto Gonzales - Araling Panlipunan)");
  console.log("  - Teacher 6: username='teacher6', password='teacher123' (Patricia Ramos - MAPEH)");
  console.log("  - Teacher 7: username='teacher7', password='teacher123' (Miguel Torres - TLE)");
  console.log("  - Teacher 8: username='teacher8', password='teacher123' (Sofia Bautista - ESP)");
  console.log("  - Teacher 9: username='teacher9', password='teacher123' (Antonio Mercado - Adviser: Bonifacio)");
  console.log("  - Teacher 10: username='teacher10', password='teacher123' (Elena Valdez - Adviser: Mabini)");
  console.log("  - Teacher 11: username='teacher11', password='teacher123' (Rafael Navarro - Adviser: Luna)");
  console.log("  - Teacher 12: username='teacher12', password='teacher123' (Gabriela Ortega - Adviser: Aguinaldo)");
  console.log("  - Teacher 13: username='teacher13', password='teacher123' (Fernando Padilla - Adviser: Del Pilar Major)");
  console.log("  - Teacher 4: username='teacher4', password='teacher123' (Carmen Dela Cruz - Filipino)");
  console.log("  - Teacher 5: username='teacher5', password='teacher123' (Roberto Gonzales - Araling Panlipunan)");
  console.log("  - Teacher 6: username='teacher6', password='teacher123' (Patricia Ramos - MAPEH)");
  console.log("  - Teacher 7: username='teacher7', password='teacher123' (Miguel Torres - TLE)");
  console.log("  - Teacher 8: username='teacher8', password='teacher123' (Sofia Bautista - ESP)");
  console.log("  - Admin: username='admin', password='admin123'");
  console.log("  - Registrar: username='registrar', password='registrar123'");
  console.log("\nCreated:");
  console.log("  - 8 Sections across 4 grade levels:");
  console.log("    * Grade 7: Einstein (40-45), Newton (40-45)");
  console.log("    * Grade 8: Rizal (40-45), Bonifacio (40-45)");
  console.log("    * Grade 9: Mabini (40-45), Luna (40-45)");
  console.log("    * Grade 10: Aguinaldo (40-45), Del Pilar (40-45)");
  console.log("  - 17 Subjects:");
  console.log("    * Grade 7: 8 subjects (English, Math, Science, Filipino, AP, MAPEH, TLE, ESP)");
  console.log("    * Grade 8-10: 3 subjects each (English, Math, Science)");
  console.log("  - 34 Class Assignments:");
  console.log("    * Teacher 1 (Sean) - English for ALL 8 sections");
  console.log("    * Teacher 2 (Maria) - Math for ALL 8 sections");
  console.log("    * Teacher 3 (Jose) - Science for ALL 8 sections");
  console.log("    * Teachers 4-8 - Other subjects for Grade 7 only");
  console.log("  - 320-360 Students total (40-45 per section)");
  console.log("  - Q1-Q4 Grades generated with realistic distribution:");
  console.log("    * ~85% Passing grades (75-98)");
  console.log("    * ~10% Failing grades (below 75)");
  console.log("    * ~5% Incomplete (INC) - missing requirements");
  console.log("    * Student performance tends to improve slightly in later quarters");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
