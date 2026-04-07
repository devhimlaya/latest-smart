import "dotenv/config";
import { PrismaClient, Role, GradeLevel, SubjectType, Quarter } from "@prisma/client";
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

  // Create Subjects (Grade 7 only)
  const subjects = [
    { code: "ENG7", name: "English 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MATH7", name: "Mathematics 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "SCI7", name: "Science 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "FIL7", name: "Filipino 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "AP7", name: "Araling Panlipunan 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "MAPEH7", name: "MAPEH 7", type: SubjectType.PE_HEALTH, ww: 20, pt: 60, qa: 20 },
    { code: "TLE7", name: "TLE 7", type: SubjectType.TLE, ww: 20, pt: 60, qa: 20 },
    { code: "ESP7", name: "Edukasyon sa Pagpapakatao 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
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

  // Create Grade 7 Sections only
  const sections = [
    { name: "Einstein", gradeLevel: GradeLevel.GRADE_7, isAdvisory: true },
    { name: "Newton", gradeLevel: GradeLevel.GRADE_7, isAdvisory: false },
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

    // Update adviser for Einstein section
    if (section.isAdvisory && teacher) {
      await prisma.$executeRaw`UPDATE "Section" SET "adviserId" = ${teacher.id} WHERE name = ${section.name} AND "gradeLevel" = ${section.gradeLevel}::"GradeLevel" AND "schoolYear" = ${schoolYear}`;
    }
  }

  // Get created sections
  const sectionEinstein = await prisma.section.findFirst({
    where: { name: "Einstein", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionNewton = await prisma.section.findFirst({
    where: { name: "Newton", gradeLevel: GradeLevel.GRADE_7 },
  });

  // Create Class Assignments
  // Teacher 1 (Sean Justin Roma) - English for both sections ONLY
  // Teacher 2 (Maria Santos) - Math for both sections ONLY
  // Teacher 3 (Jose Reyes) - Science for both sections
  // Teachers 4-8 - Other subjects for both sections
  
  const classAssignments = [
    // Teacher 1 - English for both sections
    { teacherId: teacher.id, subjectId: english7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher.id, subjectId: english7!.id, sectionId: sectionNewton!.id },
    // Teacher 2 - Math for both sections
    { teacherId: teacher2.id, subjectId: math7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher2.id, subjectId: math7!.id, sectionId: sectionNewton!.id },
    // Teacher 3 - Science for both sections
    { teacherId: teacher3.id, subjectId: science7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher3.id, subjectId: science7!.id, sectionId: sectionNewton!.id },
    // Teacher 4 - Filipino for both sections
    { teacherId: teacher4.id, subjectId: filipino7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher4.id, subjectId: filipino7!.id, sectionId: sectionNewton!.id },
    // Teacher 5 - Araling Panlipunan for both sections
    { teacherId: teacher5.id, subjectId: ap7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher5.id, subjectId: ap7!.id, sectionId: sectionNewton!.id },
    // Teacher 6 - MAPEH for both sections
    { teacherId: teacher6.id, subjectId: mapeh7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher6.id, subjectId: mapeh7!.id, sectionId: sectionNewton!.id },
    // Teacher 7 - TLE for both sections
    { teacherId: teacher7.id, subjectId: tle7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher7.id, subjectId: tle7!.id, sectionId: sectionNewton!.id },
    // Teacher 8 - ESP for both sections
    { teacherId: teacher8.id, subjectId: esp7!.id, sectionId: sectionEinstein!.id },
    { teacherId: teacher8.id, subjectId: esp7!.id, sectionId: sectionNewton!.id },
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

  // Create 39 more students for Einstein section (total 40)
  let studentCounter = 2;
  
  for (let i = 0; i < 39; i++) {
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

  // Create 40 students for Newton section
  for (let i = 0; i < 40; i++) {
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
      // Generate realistic scores
      const basePerformance = 0.75 + Math.random() * 0.23; // 75% to 98%
      
      const wwScores = [
        { name: "Quiz 1", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
        { name: "Quiz 2", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
        { name: "Quiz 3", score: Math.round(13 + Math.random() * 7), maxScore: 20 },
        { name: "Quiz 4", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
        { name: "Quiz 5", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
      ];
      const ptScores = [
        { name: "Project 1", score: Math.round(35 + Math.random() * 15), maxScore: 50 },
        { name: "Project 2", score: Math.round(38 + Math.random() * 12), maxScore: 50 },
        { name: "Project 3", score: Math.round(40 + Math.random() * 10), maxScore: 50 },
      ];
      const qaScore = Math.round(70 + Math.random() * 30);
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
          remarks: quarterlyGrade >= 75 ? "Passed" : "Failed",
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
          remarks: quarterlyGrade >= 75 ? "Passed" : "Failed",
        },
      });
    }

    console.log(`  - Generated grades for ${classAssignment.section.name} - ${classAssignment.subject.name}`);
  }

  console.log("\nSeed completed!");
  console.log("Created users:");
  console.log("  - Teacher 1: username='teacher', password='teacher123' (Sean Justin Roma - English Major, Advisory)");
  console.log("  - Teacher 2: username='teacher2', password='teacher123' (Maria Santos - Mathematics Major)");
  console.log("  - Teacher 3: username='teacher3', password='teacher123' (Jose Reyes - Science Major)");
  console.log("  - Teacher 4: username='teacher4', password='teacher123' (Carmen Dela Cruz - Filipino)");
  console.log("  - Teacher 5: username='teacher5', password='teacher123' (Roberto Gonzales - Araling Panlipunan)");
  console.log("  - Teacher 6: username='teacher6', password='teacher123' (Patricia Ramos - MAPEH)");
  console.log("  - Teacher 7: username='teacher7', password='teacher123' (Miguel Torres - TLE)");
  console.log("  - Teacher 8: username='teacher8', password='teacher123' (Sofia Bautista - ESP)");
  console.log("  - Admin: username='admin', password='admin123'");
  console.log("  - Registrar: username='registrar', password='registrar123'");
  console.log("\nCreated:");
  console.log("  - 2 Grade 7 Sections (Einstein, Newton)");
  console.log("  - 8 Subjects (Grade 7)");
  console.log("  - 16 Class Assignments (All 8 subjects for both sections)");
  console.log("  - 80 Students (40 per section)");
  console.log("  - Q1 Grades for all 8 subjects in both sections");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
