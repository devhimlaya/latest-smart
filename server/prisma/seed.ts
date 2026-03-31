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
  // Use counter to ensure uniqueness
  const paddedCounter = counter.toString().padStart(11, '0');
  return `1${paddedCounter}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

  // Create users
  const teacherUser = await prisma.user.upsert({
    where: { username: "teacher" },
    update: {
      firstName: "Jayrelle B.",
      lastName: "Sy, Ph.D",
      email: "jayrelle.sy@school.edu.ph",
    },
    create: {
      username: "teacher",
      password: teacherPassword,
      role: Role.TEACHER,
      firstName: "Jayrelle B.",
      lastName: "Sy, Ph.D",
      email: "jayrelle.sy@school.edu.ph",
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

  // Create Teacher profile for Ms. Jay
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeId: "EMP-2024-001",
      specialization: "English",
    },
  });

  // Create Subjects (DepEd Junior High School)
  const subjects = [
    { code: "ENG7", name: "English 7", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "ENG8", name: "English 8", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "ENG9", name: "English 9", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
    { code: "ENG10", name: "English 10", type: SubjectType.CORE, ww: 30, pt: 50, qa: 20 },
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
  const english8 = await prisma.subject.findUnique({ where: { code: "ENG8" } });
  const english9 = await prisma.subject.findUnique({ where: { code: "ENG9" } });
  const english10 = await prisma.subject.findUnique({ where: { code: "ENG10" } });
  const math7 = await prisma.subject.findUnique({ where: { code: "MATH7" } });
  const science7 = await prisma.subject.findUnique({ where: { code: "SCI7" } });
  const filipino7 = await prisma.subject.findUnique({ where: { code: "FIL7" } });
  const ap7 = await prisma.subject.findUnique({ where: { code: "AP7" } });
  const mapeh7 = await prisma.subject.findUnique({ where: { code: "MAPEH7" } });
  const tle7 = await prisma.subject.findUnique({ where: { code: "TLE7" } });
  const esp7 = await prisma.subject.findUnique({ where: { code: "ESP7" } });

  // Create Sections
  const sections = [
    { name: "Einstein", gradeLevel: GradeLevel.GRADE_7, isAdvisory: true },
    { name: "Newton", gradeLevel: GradeLevel.GRADE_7, isAdvisory: false },
    { name: "Galileo", gradeLevel: GradeLevel.GRADE_8, isAdvisory: false },
    { name: "Darwin", gradeLevel: GradeLevel.GRADE_9, isAdvisory: false },
    { name: "Curie", gradeLevel: GradeLevel.GRADE_10, isAdvisory: false },
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
        adviserId: section.isAdvisory ? teacher.id : undefined,
      },
    });
  }

  // Get created sections
  const sectionEinstein = await prisma.section.findFirst({
    where: { name: "Einstein", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionNewton = await prisma.section.findFirst({
    where: { name: "Newton", gradeLevel: GradeLevel.GRADE_7 },
  });
  const sectionGalileo = await prisma.section.findFirst({
    where: { name: "Galileo", gradeLevel: GradeLevel.GRADE_8 },
  });
  const sectionDarwin = await prisma.section.findFirst({
    where: { name: "Darwin", gradeLevel: GradeLevel.GRADE_9 },
  });
  const sectionCurie = await prisma.section.findFirst({
    where: { name: "Curie", gradeLevel: GradeLevel.GRADE_10 },
  });

  // Create Class Assignments for Ms. Jay
  // Grade 7 Einstein (advisory): teaches all 8 DepEd JHS subjects
  // Other sections: teaches English only (her specialization)
  const classAssignments = [
    // Einstein (Grade 7 Advisory) - all 8 DepEd subjects
    { subjectId: english7!.id, sectionId: sectionEinstein!.id },
    { subjectId: math7!.id, sectionId: sectionEinstein!.id },
    { subjectId: science7!.id, sectionId: sectionEinstein!.id },
    { subjectId: filipino7!.id, sectionId: sectionEinstein!.id },
    { subjectId: ap7!.id, sectionId: sectionEinstein!.id },
    { subjectId: esp7!.id, sectionId: sectionEinstein!.id },
    { subjectId: mapeh7!.id, sectionId: sectionEinstein!.id },
    { subjectId: tle7!.id, sectionId: sectionEinstein!.id },
    // Other sections - English only
    { subjectId: english7!.id, sectionId: sectionNewton!.id },
    { subjectId: english8!.id, sectionId: sectionGalileo!.id },
    { subjectId: english9!.id, sectionId: sectionDarwin!.id },
    { subjectId: english10!.id, sectionId: sectionCurie!.id },
  ];

  for (const assignment of classAssignments) {
    await prisma.classAssignment.upsert({
      where: {
        teacherId_subjectId_sectionId_schoolYear: {
          teacherId: teacher.id,
          subjectId: assignment.subjectId,
          sectionId: assignment.sectionId,
          schoolYear,
        },
      },
      update: {},
      create: {
        teacherId: teacher.id,
        subjectId: assignment.subjectId,
        sectionId: assignment.sectionId,
        schoolYear,
      },
    });
  }

  // Create 40 students per section
  const allSections = [sectionEinstein, sectionNewton, sectionGalileo, sectionDarwin, sectionCurie];
  
  let studentCounter = 1; // Global counter for LRN generation
  
  for (const section of allSections) {
    if (!section) continue;
    
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
          birthDate: new Date(2010 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          address: `Brgy. ${randomElement(lastNames)}, Municipality, Province`,
          guardianName: `${randomElement(firstNames)} ${lastName}`,
          guardianContact: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
        },
      });

      // Enroll student in section
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          sectionId: section.id,
          schoolYear,
          status: "ENROLLED",
        },
      });
    }
  }

  // Generate grades for Q1 for all enrolled students
  console.log("Generating Q1 grades for all students...");

  // Get all class assignments for the teacher
  const allClassAssignments = await prisma.classAssignment.findMany({
    where: { teacherId: teacher.id },
    include: {
      section: true,
      subject: true,
    },
  });

  let totalFailingStudentsAdded = 0;
  const targetFailingStudents = 5;

  for (const classAssignment of allClassAssignments) {
    // Get all enrolled students in this section
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        sectionId: classAssignment.sectionId,
        schoolYear,
      },
      include: { student: true },
    });

    // Add 1 failing student per class (up to 5 total)
    const shouldAddFailingStudent = totalFailingStudentsAdded < targetFailingStudents;

    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      
      // Generate realistic scores
      // WW: 5 activities, each out of 20
      // PT: 3 tasks, each out of 50
      // QA: 1 exam out of 100
      
      let wwScores;
      let ptScores;
      let qaScore;
      let qaMax = 100;

      // Make some students fail (distributed across classes)
      if (shouldAddFailingStudent && i === 0) {
        totalFailingStudentsAdded++;
        // Failing student: low scores (various levels of failure)
        const failureLevel = Math.random() * 0.3; // 0 to 0.3 range for variety
        wwScores = [
          { name: "Quiz 1", score: Math.round(5 + failureLevel * 10), maxScore: 20 },
          { name: "Quiz 2", score: Math.round(4 + failureLevel * 10), maxScore: 20 },
          { name: "Quiz 3", score: Math.round(6 + failureLevel * 10), maxScore: 20 },
          { name: "Quiz 4", score: Math.round(5 + failureLevel * 9), maxScore: 20 },
          { name: "Quiz 5", score: Math.round(5 + failureLevel * 10), maxScore: 20 },
        ];
        ptScores = [
          { name: "Essay Writing", score: Math.round(15 + failureLevel * 20), maxScore: 50 },
          { name: "Oral Presentation", score: Math.round(12 + failureLevel * 20), maxScore: 50 },
          { name: "Group Project", score: Math.round(18 + failureLevel * 20), maxScore: 50 },
        ];
        qaScore = Math.round(30 + failureLevel * 25);
      } else {
        // Regular students: varied good scores 75-98
        const basePerformance = 0.75 + Math.random() * 0.23; // 75% to 98%
        
        wwScores = [
          { name: "Quiz 1", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
          { name: "Quiz 2", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
          { name: "Quiz 3", score: Math.round(13 + Math.random() * 7), maxScore: 20 },
          { name: "Quiz 4", score: Math.round(15 + Math.random() * 5), maxScore: 20 },
          { name: "Quiz 5", score: Math.round(14 + Math.random() * 6), maxScore: 20 },
        ];
        ptScores = [
          { name: "Essay Writing", score: Math.round(35 + Math.random() * 15), maxScore: 50 },
          { name: "Oral Presentation", score: Math.round(38 + Math.random() * 12), maxScore: 50 },
          { name: "Group Project", score: Math.round(40 + Math.random() * 10), maxScore: 50 },
        ];
        qaScore = Math.round(70 + Math.random() * 30);
      }

      // Calculate weighted scores
      const wwTotal = wwScores.reduce((sum, s) => sum + s.score, 0);
      const wwMaxTotal = wwScores.reduce((sum, s) => sum + s.maxScore, 0);
      const wwPS = (wwTotal / wwMaxTotal) * 100;

      const ptTotal = ptScores.reduce((sum, s) => sum + s.score, 0);
      const ptMaxTotal = ptScores.reduce((sum, s) => sum + s.maxScore, 0);
      const ptPS = (ptTotal / ptMaxTotal) * 100;

      const qaPS = (qaScore / qaMax) * 100;

      // Calculate initial grade using weights
      const wwWeight = classAssignment.subject.writtenWorkWeight;
      const ptWeight = classAssignment.subject.perfTaskWeight;
      const qaWeight = classAssignment.subject.quarterlyAssessWeight;

      const initialGrade = (wwPS * wwWeight / 100) + (ptPS * ptWeight / 100) + (qaPS * qaWeight / 100);

      // Transmute to DepEd grading scale
      const transmute = (initial: number): number => {
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
      };

      const quarterlyGrade = transmute(initialGrade);

      // Create or update grade
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

  console.log("Seed completed!");
  console.log("Created users:");
  console.log("  - Teacher: username='teacher', password='teacher123' (Ms. Jay Santos)");
  console.log("  - Admin: username='admin', password='admin123'");
  console.log("  - Registrar: username='registrar', password='registrar123'");
  console.log("\nCreated:");
  console.log("  - 5 Sections (Einstein, Newton, Galileo, Darwin, Curie)");
  console.log("  - 11 Subjects");
  console.log("  - 5 Class Assignments for Ms. Jay (English 7-10)");
  console.log("  - ~200 Students (40 per section)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
