import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest, authorizeRoles } from "../middleware/auth";
import type { Student, Enrollment, Section, ClassAssignment, Subject, Teacher, User, Grade } from "@prisma/client";

const router = Router();

// Type definitions for query results
type StudentWithDetails = Student;
type EnrollmentWithStudent = Enrollment & { student: Student };
type SectionWithEnrollments = Section & { 
  enrollments: EnrollmentWithStudent[];
  _count?: { enrollments: number };
};
type TeacherWithUser = Teacher & { user: Pick<User, 'firstName' | 'lastName'> };
type ClassAssignmentWithDetails = ClassAssignment & {
  subject: Subject;
  teacher: TeacherWithUser;
  grades?: Grade[];
};

// Get teacher's advisory section
router.get(
  "/my-advisory",
  authenticateToken,
  authorizeRoles("TEACHER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user?.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!teacher) {
        res.status(404).json({ message: "Teacher profile not found" });
        return;
      }

      // Find advisory section assigned to this teacher
      const advisorySection = await prisma.section.findFirst({
        where: { adviserId: teacher.id } as any,
        include: {
          enrollments: {
            where: { status: "ENROLLED" },
            include: {
              student: true,
            },
            orderBy: {
              student: {
                lastName: "asc",
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }) as SectionWithEnrollments | null;

      if (!advisorySection) {
        res.json({ 
          hasAdvisory: false,
          message: "No advisory section assigned",
          teacher: {
            id: teacher.id,
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            employeeId: teacher.employeeId,
          },
        });
        return;
      }

      // Get class assignments for this section (to know which subjects they have)
      const classAssignments = await prisma.classAssignment.findMany({
        where: { sectionId: advisorySection.id },
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      }) as ClassAssignmentWithDetails[];

      // Calculate section stats
      const students: StudentWithDetails[] = advisorySection.enrollments.map((e: EnrollmentWithStudent) => e.student);
      const maleCount = students.filter((s: StudentWithDetails) => s.gender?.toLowerCase() === "male").length;
      const femaleCount = students.filter((s: StudentWithDetails) => s.gender?.toLowerCase() === "female").length;

      res.json({
        hasAdvisory: true,
        teacher: {
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          employeeId: teacher.employeeId,
        },
        section: {
          id: advisorySection.id,
          name: advisorySection.name,
          gradeLevel: advisorySection.gradeLevel,
          schoolYear: advisorySection.schoolYear,
        },
        students: students.map((student: StudentWithDetails, index: number) => ({
          ...student,
          rank: index + 1,
        })),
        stats: {
          totalStudents: students.length,
          maleCount,
          femaleCount,
        },
        subjects: classAssignments.map((ca: ClassAssignmentWithDetails) => ({
          id: ca.subject.id,
          code: ca.subject.code,
          name: ca.subject.name,
          type: ca.subject.type,
          teacher: `${ca.teacher.user.firstName} ${ca.teacher.user.lastName}`,
        })),
      });
    } catch (error) {
      console.error("Error fetching advisory:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get student's complete grade profile (all subjects, all quarters)
router.get(
  "/student/:studentId/grades",
  authenticateToken,
  authorizeRoles("TEACHER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.params.studentId as string;
      const schoolYear = req.query.schoolYear as string | undefined;

      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user?.id },
      });

      if (!teacher) {
        res.status(404).json({ message: "Teacher profile not found" });
        return;
      }

      // Get student with their enrollment
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            where: schoolYear ? { schoolYear } : {},
            include: {
              section: true,
            },
            orderBy: {
              schoolYear: "desc",
            },
            take: 1,
          },
        },
      });

      if (!student) {
        res.status(404).json({ message: "Student not found" });
        return;
      }

      const currentEnrollment = student.enrollments[0];
      if (!currentEnrollment) {
        res.status(404).json({ message: "Student not enrolled" });
        return;
      }

      // Verify teacher is adviser of this section
      const section = await prisma.section.findFirst({
        where: {
          id: currentEnrollment.sectionId,
          adviserId: teacher.id,
        } as any,
      });

      // Also allow if teacher teaches this student (any class assignment)
      const teachesStudent = await prisma.classAssignment.findFirst({
        where: {
          teacherId: teacher.id,
          sectionId: currentEnrollment.sectionId,
        },
      });

      if (!section && !teachesStudent) {
        res.status(403).json({ message: "Not authorized to view this student" });
        return;
      }

      // Get all class assignments for this section
      const classAssignments = await prisma.classAssignment.findMany({
        where: { 
          sectionId: currentEnrollment.sectionId,
          schoolYear: currentEnrollment.schoolYear,
        },
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          grades: {
            where: { studentId },
          },
        },
        orderBy: {
          subject: {
            name: "asc",
          },
        },
      }) as (ClassAssignment & { 
        subject: Subject; 
        teacher: TeacherWithUser; 
        grades: Grade[] 
      })[];

      // Format grades by subject
      const subjectGrades = classAssignments.map((ca) => {
        const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
        const gradesByQuarter: Record<string, {
          writtenWorkPS: number | null;
          perfTaskPS: number | null;
          quarterlyAssessPS: number | null;
          initialGrade: number | null;
          quarterlyGrade: number | null;
        } | null> = {};
        
        quarters.forEach((q) => {
          const grade = ca.grades.find((g: Grade) => g.quarter === q);
          gradesByQuarter[q] = grade ? {
            writtenWorkPS: grade.writtenWorkPS,
            perfTaskPS: grade.perfTaskPS,
            quarterlyAssessPS: grade.quarterlyAssessPS,
            initialGrade: grade.initialGrade,
            quarterlyGrade: grade.quarterlyGrade,
          } : null;
        });

        // Calculate final grade (average of available quarterly grades)
        const quarterlyGrades = Object.values(gradesByQuarter)
          .filter((g): g is NonNullable<typeof g> => g?.quarterlyGrade !== null && g?.quarterlyGrade !== undefined)
          .map((g) => g.quarterlyGrade as number);
        
        const finalGrade = quarterlyGrades.length > 0 
          ? Math.round(quarterlyGrades.reduce((a, b) => a + b, 0) / quarterlyGrades.length)
          : null;

        return {
          subjectId: ca.subject.id,
          subjectCode: ca.subject.code,
          subjectName: ca.subject.name,
          subjectType: ca.subject.type,
          teacher: `${ca.teacher.user.firstName} ${ca.teacher.user.lastName}`,
          grades: gradesByQuarter,
          finalGrade,
          remarks: finalGrade ? (finalGrade >= 75 ? "PASSED" : "FAILED") : null,
        };
      });

      // Calculate General Average
      const finalGrades = subjectGrades
        .filter((s) => s.finalGrade !== null)
        .map((s) => s.finalGrade as number);
      
      const generalAverage = finalGrades.length > 0
        ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100
        : null;

      // Determine honors based on DepEd criteria
      let honors: string | null = null;
      if (generalAverage !== null) {
        if (generalAverage >= 98) honors = "With Highest Honors";
        else if (generalAverage >= 95) honors = "With High Honors";
        else if (generalAverage >= 90) honors = "With Honors";
      }

      // Determine promotion status
      let promotionStatus: string | null = null;
      if (finalGrades.length === subjectGrades.length && finalGrades.length > 0) {
        const failedSubjects = subjectGrades.filter((s) => s.finalGrade !== null && s.finalGrade < 75);
        if (failedSubjects.length === 0) {
          promotionStatus = "PROMOTED";
        } else if (failedSubjects.length <= 2) {
          promotionStatus = "CONDITIONALLY PROMOTED";
        } else {
          promotionStatus = "RETAINED";
        }
      }

      res.json({
        student: {
          id: student.id,
          lrn: student.lrn,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          suffix: student.suffix,
          gender: student.gender,
          birthDate: student.birthDate,
          address: student.address,
          guardianName: student.guardianName,
          guardianContact: student.guardianContact,
        },
        enrollment: {
          sectionName: currentEnrollment.section.name,
          gradeLevel: currentEnrollment.section.gradeLevel,
          schoolYear: currentEnrollment.schoolYear,
          status: currentEnrollment.status,
        },
        subjectGrades,
        summary: {
          generalAverage,
          honors,
          promotionStatus,
          totalSubjects: subjectGrades.length,
          completedSubjects: finalGrades.length,
        },
      });
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get advisory section summary (for report card generation)
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("TEACHER"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user?.id },
      });

      if (!teacher) {
        res.status(404).json({ message: "Teacher profile not found" });
        return;
      }

      const advisorySection = await prisma.section.findFirst({
        where: { adviserId: teacher.id } as any,
        include: {
          enrollments: {
            where: { status: "ENROLLED" },
            include: {
              student: true,
            },
          },
        },
      }) as SectionWithEnrollments | null;

      if (!advisorySection) {
        res.json({ hasAdvisory: false });
        return;
      }

      // Get all grades for students in this section
      const classAssignments = await prisma.classAssignment.findMany({
        where: { sectionId: advisorySection.id },
        include: {
          grades: {
            where: { quarter: "Q1" }, // Current quarter
          },
        },
      }) as (ClassAssignment & { grades: Grade[] })[];

      // Calculate rankings based on general average
      interface StudentAverage {
        studentId: string;
        name: string;
        lrn: string;
        gender: string | null;
        average: number | null;
        gradedSubjects: number;
        totalSubjects: number;
      }

      const studentAverages: StudentAverage[] = await Promise.all(
        advisorySection.enrollments.map(async (enrollment: EnrollmentWithStudent) => {
          const studentGrades = classAssignments.flatMap((ca) =>
            ca.grades.filter((g: Grade) => g.studentId === enrollment.studentId)
          );

          const quarterlyGrades = studentGrades
            .map((g: Grade) => g.quarterlyGrade)
            .filter((g): g is number => g !== null);

          const average = quarterlyGrades.length > 0
            ? quarterlyGrades.reduce((a, b) => a + b, 0) / quarterlyGrades.length
            : null;

          return {
            studentId: enrollment.student.id,
            name: `${enrollment.student.lastName}, ${enrollment.student.firstName}`,
            lrn: enrollment.student.lrn,
            gender: enrollment.student.gender,
            average,
            gradedSubjects: quarterlyGrades.length,
            totalSubjects: classAssignments.length,
          };
        })
      );

      // Sort by average (highest first) and assign ranks
      const rankedStudents = studentAverages
        .filter((s: StudentAverage) => s.average !== null)
        .sort((a: StudentAverage, b: StudentAverage) => (b.average ?? 0) - (a.average ?? 0))
        .map((student: StudentAverage, index: number) => ({
          ...student,
          rank: index + 1,
          honors: student.average! >= 98 ? "Highest Honors" :
                  student.average! >= 95 ? "High Honors" :
                  student.average! >= 90 ? "Honors" :
                  student.average! >= 85 ? "With Honors" : null,
        }));

      // Students without grades yet
      const ungradedStudents = studentAverages
        .filter((s: StudentAverage) => s.average === null)
        .map((s: StudentAverage) => ({ ...s, rank: null, honors: null }));

      res.json({
        hasAdvisory: true,
        section: {
          id: advisorySection.id,
          name: advisorySection.name,
          gradeLevel: advisorySection.gradeLevel,
          schoolYear: advisorySection.schoolYear,
        },
        rankings: [...rankedStudents, ...ungradedStudents],
        stats: {
          totalStudents: advisorySection.enrollments.length,
          gradedStudents: rankedStudents.length,
          withHonors: rankedStudents.filter((s) => s.honors !== null).length,
          passingRate: rankedStudents.length > 0
            ? Math.round((rankedStudents.filter((s) => (s.average ?? 0) >= 75).length / rankedStudents.length) * 100)
            : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching advisory summary:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
