import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import XlsxPopulate from 'xlsx-populate';

import { AuditAction, AuditSeverity } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticateToken, authorizeRoles, type AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../lib/audit';

const router = Router();

// Configure multer storage for ECR templates
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ecr-templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const subject = (req.body.subjectName || 'ECR') as string;
    const safeSubject = subject.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `ECR_${safeSubject}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Helper to delete files if not referenced
async function deleteFileIfUnreferenced(filePath: string): Promise<void> {
  const activeReferences = await prisma.eCRTemplate.count({
    where: { filePath }
  });

  if (activeReferences === 0 && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Helper to build audit user info
function buildAuditUser(req: AuthRequest) {
  if (!req.user) {
    throw new Error('Missing authenticated user');
  }

  return {
    id: req.user.id,
    firstName: req.user.username,
    lastName: '',
    role: req.user.role
  };
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ========================================
// Admin Routes - ECR Template Management
// ========================================

/**
 * GET /api/ecr-templates
 * List all ECR templates
 */
router.get('/', authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await prisma.eCRTemplate.findMany({
      orderBy: [
        { isActive: 'desc' },
        { subjectName: 'asc' }
      ]
    });

    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Failed to fetch ECR templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ecr-templates/:id
 * Get specific ECR template details
 */
router.get('/:id', authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const template = await prisma.eCRTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      res.status(404).json({ success: false, error: 'ECR template not found' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Failed to fetch ECR template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ecr-templates/upload
 * Upload a new ECR template (Admin only)
 */
router.post('/upload', authorizeRoles('ADMIN'), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const { subjectName, subjectType, description, instructions } = req.body;

    if (!subjectName) {
      res.status(400).json({ success: false, error: 'Subject name is required' });
      return;
    }

    // Validate subjectType if provided
    const validTypes = ['CORE', 'MATH_SCIENCE', 'PE_HEALTH', 'TLE', 'MAPEH'];
    const parsedSubjectType = subjectType && validTypes.includes(subjectType) ? subjectType : null;

    // Check if template for this subject already exists
    const existingTemplate = await prisma.eCRTemplate.findFirst({
      where: { subjectName }
    });

    if (existingTemplate) {
      // Delete the newly uploaded file since we won't use it
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ 
        success: false, 
        error: `An ECR template for ${subjectName} already exists. Delete or replace the existing template first.` 
      });
      return;
    }

    // Validate Excel file
    try {
      const workbook = XLSX.readFile(req.file.path);
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file has no worksheets');
      }
    } catch (error) {
      // Clean up invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ 
        success: false, 
        error: 'Invalid Excel file. Please upload a valid .xlsx or .xls file.' 
      });
      return;
    }

    // Create ECR template record
    const template = await prisma.eCRTemplate.create({
      data: {
        subjectName,
        subjectType: parsedSubjectType,
        description: description || null,
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        instructions: instructions || null,
        isActive: true,
        uploadedBy: req.user!.id,
        uploadedByName: req.user!.username
      } as any
    });

    await createAuditLog(
      AuditAction.CREATE,
      buildAuditUser(req),
      `ECR Template: ${subjectName}`,
      'ECR Template',
      `Uploaded new ECR template for ${subjectName}`,
      req.ip,
      AuditSeverity.INFO,
      template.id
    );

    res.json({ 
      success: true, 
      message: 'ECR template uploaded successfully', 
      data: template 
    });
  } catch (error: any) {
    console.error('Failed to upload ECR template:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/ecr-templates/:id
 * Update ECR template metadata (not the file itself)
 */
router.put('/:id', authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { subjectType, description, instructions, isActive } = req.body;

    const template = await prisma.eCRTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      res.status(404).json({ success: false, error: 'ECR template not found' });
      return;
    }

    const validTypes = ['CORE', 'MATH_SCIENCE', 'PE_HEALTH', 'TLE', 'MAPEH'];
    const parsedSubjectType = subjectType === '' ? null : (subjectType && validTypes.includes(subjectType) ? subjectType : undefined);

    const updatedTemplate = await prisma.eCRTemplate.update({
      where: { id },
      data: {
        ...(parsedSubjectType !== undefined ? { subjectType: parsedSubjectType } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(instructions !== undefined ? { instructions } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      } as any
    });

    await createAuditLog(
      AuditAction.UPDATE,
      buildAuditUser(req),
      `ECR Template: ${template.subjectName}`,
      'ECR Template',
      `Updated ECR template for ${template.subjectName}`,
      req.ip,
      AuditSeverity.INFO,
      id
    );

    res.json({ success: true, data: updatedTemplate });
  } catch (error: any) {
    console.error('Failed to update ECR template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/ecr-templates/:id
 * Delete an ECR template (Admin only)
 */
router.delete('/:id', authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const template = await prisma.eCRTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      res.status(404).json({ success: false, error: 'ECR template not found' });
      return;
    }

    await prisma.eCRTemplate.delete({
      where: { id }
    });

    // Delete physical file if no longer referenced
    await deleteFileIfUnreferenced(template.filePath);

    await createAuditLog(
      AuditAction.DELETE,
      buildAuditUser(req),
      `ECR Template: ${template.subjectName}`,
      'ECR Template',
      `Deleted ECR template for ${template.subjectName}`,
      req.ip,
      AuditSeverity.WARNING,
      id
    );

    res.json({ success: true, message: 'ECR template deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete ECR template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ecr-templates/:id/download
 * Download the blank template file
 */
router.get('/:id/download', authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const template = await prisma.eCRTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      res.status(404).json({ success: false, error: 'ECR template not found' });
      return;
    }

    if (!fs.existsSync(template.filePath)) {
      res.status(404).json({ success: false, error: 'Template file not found on disk' });
      return;
    }

    // Create clean filename
    const cleanFileName = `ECR_${template.subjectName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.xlsx`;

    res.download(template.filePath, cleanFileName);
  } catch (error: any) {
    console.error('Failed to download ECR template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ecr-templates/generate/:classAssignmentId  
 * Generate ECR - Uses xlsx-populate (FAST + preserves all formatting)
 */
router.post('/generate/:classAssignmentId', authorizeRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    const classAssignmentId = Array.isArray(req.params.classAssignmentId) ? req.params.classAssignmentId[0] : req.params.classAssignmentId;
    const quarter: string = req.body.quarter || 'Q1'; // Q1, Q2, Q3, or Q4
    const quarterNum = quarter.replace('Q', ''); // '1', '2', '3', '4'
    console.log(`[ECR] Starting FAST generation for: ${classAssignmentId}, quarter: ${quarter}`);

    // Fetch class assignment and settings first
    const [classAssignment, settings] = await Promise.all([
      prisma.classAssignment.findUnique({
        where: { id: classAssignmentId },
        include: {
          teacher: { include: { user: true } },
          subject: true,
          section: {
            include: {
              enrollments: {
                where: { status: 'ENROLLED' },
                include: { student: true },
                orderBy: { student: { lastName: 'asc' } }
              }
            }
          }
        }
      }) as any,
      prisma.systemSettings.findUnique({ where: { id: 'main' }, select: { schoolName: true, schoolId: true, division: true, region: true } }),
    ]);

    // Determine which quarter sheets to fill: Q1 through selected quarter
    // e.g. downloading Q3 fills Q1, Q2, and Q3 sheets
    const quartersToFill = Array.from({ length: parseInt(quarterNum) }, (_, i) => `Q${i + 1}`);
    console.log(`[ECR] Will fill sheets for quarters: ${quartersToFill.join(', ')}`);

    // Fetch grades for all needed quarters in parallel
    const gradeSelect = {
      studentId: true, writtenWorkScores: true, perfTaskScores: true,
      quarterlyAssessScore: true, quarterlyAssessMax: true,
      writtenWorkPS: true, perfTaskPS: true, quarterlyAssessPS: true,
      initialGrade: true, quarterlyGrade: true
    };
    const allGradeArrays = await Promise.all(
      quartersToFill.map(q => prisma.grade.findMany({ where: { classAssignmentId, quarter: q } as any, select: gradeSelect }))
    );
    // Build per-quarter grade maps: quarter -> (studentId -> grade)
    const gradesByQuarter = new Map<string, Map<string, any>>();
    quartersToFill.forEach((q, idx) => {
      const m = new Map<string, any>();
      allGradeArrays[idx].forEach((g: any) => m.set(g.studentId, g));
      gradesByQuarter.set(q, m);
    });

    if (!classAssignment) { res.status(404).json({ success: false, error: 'Class not found' }); return; }
    if (req.user!.role !== 'ADMIN' && req.user!.id !== classAssignment.teacher.userId) { res.status(403).json({ success: false, error: 'Not authorized' }); return; }
    console.log(`[ECR] Data fetched in ${Date.now() - startTime}ms`);

    // Find template — priority: exact subject name → subject type → any active
    const baseSubjectName = classAssignment.subject.name.replace(/\s+\d+$/, '').trim();
    const subjectType = classAssignment.subject.type; // e.g. 'CORE', 'PE_HEALTH', 'TLE', 'MAPEH'
    let ecrTemplate: { filePath: string; subjectName: string } | null = null;

    // 1) Exact subject name match (most specific)
    const nameMatch = await prisma.eCRTemplate.findFirst({
      where: { OR: [{ subjectName: baseSubjectName, isActive: true }, { subjectName: classAssignment.subject.name, isActive: true }] },
      select: { filePath: true, subjectName: true },
      orderBy: { updatedAt: 'desc' }
    });
    if (nameMatch && fs.existsSync(nameMatch.filePath)) {
      ecrTemplate = nameMatch;
      console.log(`[ECR] Template: exact subject name match "${baseSubjectName}"`);
    }

    // 2) Subject type match (e.g. any CORE template, any PE_HEALTH template)
    if (!ecrTemplate) {
      const typeMatch = await prisma.eCRTemplate.findFirst({
        where: { subjectType: subjectType as any, isActive: true },
        select: { filePath: true, subjectName: true },
        orderBy: { updatedAt: 'desc' }
      });
      if (typeMatch && fs.existsSync(typeMatch.filePath)) {
        ecrTemplate = typeMatch;
        console.log(`[ECR] Template: subject type match (${subjectType}) → "${typeMatch.subjectName}"`);
      }
    }

    // 3) Any active template as last resort
    if (!ecrTemplate) {
      console.log(`[ECR] No name/type match for "${baseSubjectName}" (${subjectType}), trying any active template...`);
      const allTemplates = await prisma.eCRTemplate.findMany({
        where: { isActive: true },
        select: { filePath: true, subjectName: true },
        orderBy: { updatedAt: 'desc' }
      });
      for (const t of allTemplates) {
        if (fs.existsSync(t.filePath)) {
          ecrTemplate = t;
          console.log(`[ECR] Template: any-active fallback → "${t.subjectName}" (${t.filePath})`);
          break;
        }
      }
    }
    
    if (!ecrTemplate || !fs.existsSync(ecrTemplate.filePath)) { res.status(404).json({ success: false, error: 'No ECR template found. Please upload an ECR template in Admin → ECR Templates.' }); return; }

    // Load workbook with xlsx-populate (FAST!)
    const workbook = await XlsxPopulate.fromFileAsync(ecrTemplate.filePath);
    
    // Get all sheet names for debugging
    const allSheets: string[] = [];
    let sheetIndex = 0;
    while (true) {
      try {
        const s = workbook.sheet(sheetIndex);
        allSheets.push(s.name());
        sheetIndex++;
      } catch {
        break;
      }
    }
    console.log(`[ECR] Available sheets: ${allSheets.join(', ')}`);
    
    // Find INPUT DATA sheet (has student names with MALE/FEMALE sections)
    let inputDataSheet: any = null;
    try {
      inputDataSheet = workbook.sheet('INPUT DATA');
      console.log(`[ECR] Found INPUT DATA sheet`);
    } catch {
      console.log(`[ECR] No INPUT DATA sheet found - using default names`);
    }
    
    console.log(`[ECR] Template loaded in ${Date.now() - startTime}ms`);

    const students = classAssignment.section.enrollments.map((e: any) => e.student);
    console.log(`[ECR] Students in class: ${students.length}`);
    console.log(`[ECR] Grade records fetched: Q1=${allGradeArrays[0]?.length ?? 0} Q2=${allGradeArrays[1]?.length ?? 0} Q3=${allGradeArrays[2]?.length ?? 0} Q4=${allGradeArrays[3]?.length ?? 0}`);

    const teacherName = `${classAssignment.teacher.user.firstName || ''} ${classAssignment.teacher.user.lastName || ''}`.trim() || classAssignment.teacher.user.username;

    // Separate students by gender — same for all quarters
    const maleStudents: any[] = [];
    const femaleStudents: any[] = [];
    students.forEach((s: any) => {
      const g = (s.gender || '').toUpperCase().trim();
      if (g === 'MALE') {
        maleStudents.push(s);
      } else if (g === 'FEMALE') {
        femaleStudents.push(s);
      } else {
        console.log(`[ECR] ⚠ Student ${s.lastName} has no gender set (value: "${s.gender}"), treating as MALE`);
        maleStudents.push(s);
      }
    });
    console.log(`[ECR] Students by gender: ${maleStudents.length} MALE, ${femaleStudents.length} FEMALE`);

    // Write student names to INPUT DATA sheet once (same for all quarters)
    if (inputDataSheet) {
      let inputMaleRow = -1;
      let inputFemaleRow = -1;
      const idRange = inputDataSheet.usedRange();
      if (idRange) {
        const endRow = idRange.endCell().rowNumber();
        for (let r = 1; r <= endRow; r++) {
          const val = inputDataSheet.row(r).cell(2).value();
          if (typeof val === 'string') {
            const upper = val.toUpperCase().trim();
            if (upper === 'MALE' && inputMaleRow === -1) inputMaleRow = r + 1;
            else if (upper === 'FEMALE' && inputFemaleRow === -1) inputFemaleRow = r + 1;
          }
        }
      }
      if (inputMaleRow > 0) {
        maleStudents.forEach((s: any, i: number) => {
          const fullName = `${s.lastName}, ${s.firstName}${s.middleName ? ' ' + s.middleName.charAt(0) + '.' : ''}`.trim();
          inputDataSheet.row(inputMaleRow + i).cell(2).value(fullName);
        });
        console.log(`[ECR] Wrote ${maleStudents.length} male names to INPUT DATA`);
      }
      if (inputFemaleRow > 0) {
        femaleStudents.forEach((s: any, i: number) => {
          const fullName = `${s.lastName}, ${s.firstName}${s.middleName ? ' ' + s.middleName.charAt(0) + '.' : ''}`.trim();
          inputDataSheet.row(inputFemaleRow + i).cell(2).value(fullName);
        });
        console.log(`[ECR] Wrote ${femaleStudents.length} female names to INPUT DATA`);
      }
    }

    // Quarter labels used for header replacement
    const quarterLabel: Record<string, string> = { Q1: 'FIRST QUARTER', Q2: 'SECOND QUARTER', Q3: 'THIRD QUARTER', Q4: 'FOURTH QUARTER' };
    const allQuarterLabels = ['FIRST QUARTER', 'SECOND QUARTER', 'THIRD QUARTER', 'FOURTH QUARTER'];
    const baseSubject = classAssignment.subject.name.split(' ')[0].toUpperCase();

    // ── Fill each quarter sheet from Q1 up to the selected quarter ──────────
    for (const currentQ of quartersToFill) {
      const currentQNum = currentQ.replace('Q', '');
      const qIdx = quartersToFill.indexOf(currentQ);
      const currentGradesByStudentId = gradesByQuarter.get(currentQ) || new Map();
      const currentGradesArray = allGradeArrays[qIdx] as any[];
      console.log(`[ECR] ── Processing ${currentQ} sheet (${currentGradesByStudentId.size} grade records) ──`);

      // Find the quarter sheet in the workbook
      const cqPattern = new RegExp(`Q${currentQNum}`, 'i');
      let gradeSheet: any = null;

      for (const sheetName of allSheets) {
        const upperName = sheetName.toUpperCase().replace(/\s+/g, '');
        const normalizedSubject = baseSubject.replace(/\s+/g, '');
        if (upperName.includes(normalizedSubject) && cqPattern.test(sheetName)) {
          gradeSheet = workbook.sheet(sheetName);
          console.log(`[ECR] [${currentQ}] Using sheet (subject+quarter match): ${sheetName}`);
          break;
        }
      }
      if (!gradeSheet) {
        for (const sheetName of allSheets) {
          const upper = sheetName.toUpperCase().replace(/\s+/g, '');
          if (cqPattern.test(sheetName) && upper !== 'SUMMARYOFQUARTERLYGRADES') {
            gradeSheet = workbook.sheet(sheetName);
            console.log(`[ECR] [${currentQ}] Using sheet (quarter fallback): ${sheetName}`);
            break;
          }
        }
      }
      if (!gradeSheet) {
        console.log(`[ECR] [${currentQ}] No matching sheet found — skipping`);
        continue;
      }

      // Replace placeholders and fix quarter header label
      const correctLabel = quarterLabel[currentQ] || quarterLabel['Q1'];
      const replacements: Record<string, string> = {
        '{{SCHOOL_NAME}}': settings?.schoolName || '',
        '{{SCHOOL_ID}}': settings?.schoolId || '',
        '{{DIVISION}}': settings?.division || '',
        '{{REGION}}': settings?.region || '',
        '{{SCHOOL_YEAR}}': classAssignment.schoolYear,
        '{{TEACHER_NAME}}': teacherName,
        '{{SUBJECT}}': classAssignment.subject.name,
        '{{SUBJECT_CODE}}': classAssignment.subject.code,
        '{{GRADE_LEVEL}}': classAssignment.section.gradeLevel.replace('GRADE_', 'Grade '),
        '{{SECTION}}': classAssignment.section.name,
        '{{SUBJECT_TYPE}}': classAssignment.subject.type
      };
      const usedRange = gradeSheet.usedRange();
      if (usedRange) {
        usedRange.forEach((cell: any) => {
          const value = cell.value();
          if (typeof value === 'string') {
            let newValue = value;
            for (const [placeholder, replacement] of Object.entries(replacements)) {
              if (newValue.includes(placeholder)) newValue = newValue.split(placeholder).join(replacement);
            }
            for (const label of allQuarterLabels) {
              if (newValue.toUpperCase() === label && label !== correctLabel) { newValue = correctLabel; break; }
            }
            if (newValue !== value) cell.value(newValue);
          }
        });
      }

      // Find MALE / FEMALE / HPS rows
      let maleInsertRow = -1;
      let femaleInsertRow = -1;
      let highestScoreRow = -1;
      const rangeForSearch = gradeSheet.usedRange();
      if (rangeForSearch) {
        const endRow = rangeForSearch.endCell().rowNumber();
        for (let r = 1; r <= Math.min(endRow, 100); r++) {
          for (let c = 1; c <= 10; c++) {
            const cellValue = gradeSheet.row(r).cell(c).value();
            if (typeof cellValue === 'string') {
              const upper = cellValue.toUpperCase().trim();
              if (upper.includes('HIGHEST') && upper.includes('SCORE')) highestScoreRow = r;
              if (upper === 'MALE' && maleInsertRow === -1) { maleInsertRow = r + 1; console.log(`[ECR] [${currentQ}] MALE section at row ${r}`); }
              if (upper === 'FEMALE' && femaleInsertRow === -1) { femaleInsertRow = r + 1; console.log(`[ECR] [${currentQ}] FEMALE section at row ${r}`); }
            }
          }
        }
      }
      if (maleInsertRow === -1) maleInsertRow = 12;
      if (femaleInsertRow === -1) femaleInsertRow = 62;

      // Clear old sample data
      for (let r = maleInsertRow; r < Math.min(maleInsertRow + 50, femaleInsertRow); r++) {
        gradeSheet.row(r).cell(1).value(null);
        gradeSheet.row(r).cell(2).value(null);
        for (let c = 6; c <= 15; c++) gradeSheet.row(r).cell(c).value(null);
        for (let c = 19; c <= 28; c++) gradeSheet.row(r).cell(c).value(null);
        gradeSheet.row(r).cell(32).value(null);
      }
      for (let r = femaleInsertRow; r < femaleInsertRow + 50; r++) {
        gradeSheet.row(r).cell(1).value(null);
        gradeSheet.row(r).cell(2).value(null);
        for (let c = 6; c <= 15; c++) gradeSheet.row(r).cell(c).value(null);
        for (let c = 19; c <= 28; c++) gradeSheet.row(r).cell(c).value(null);
        gradeSheet.row(r).cell(32).value(null);
      }

      // Insert student data for this quarter
      // Col 1=Number, 2=Name, 6-15=WW scores, 19-28=PT scores, 32=QA
      const insertStudentData = (rowNum: number, studentNumber: number, student: any): void => {
        const grade = currentGradesByStudentId.get(student.id);
        const fullName = `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName.charAt(0) + '.' : ''}`.trim();
        const wwScores = grade?.writtenWorkScores ? (Array.isArray(grade.writtenWorkScores) ? grade.writtenWorkScores : JSON.parse(grade.writtenWorkScores as any)) : [];
        const ptScores = grade?.perfTaskScores ? (Array.isArray(grade.perfTaskScores) ? grade.perfTaskScores : JSON.parse(grade.perfTaskScores as any)) : [];
        gradeSheet.row(rowNum).cell(1).value(studentNumber);
        gradeSheet.row(rowNum).cell(2).value(fullName);
        for (let w = 0; w < 10; w++) {
          const score = wwScores[w];
          gradeSheet.row(rowNum).cell(6 + w).value(score ? score.score : '');
        }
        for (let p = 0; p < 10; p++) {
          const score = ptScores[p];
          gradeSheet.row(rowNum).cell(19 + p).value(score ? score.score : '');
        }
        gradeSheet.row(rowNum).cell(32).value(grade?.quarterlyAssessPS ?? grade?.quarterlyAssessScore ?? '');
      };

      maleStudents.forEach((student: any, i: number) => insertStudentData(maleInsertRow + i, i + 1, student));
      femaleStudents.forEach((student: any, i: number) => insertStudentData(femaleInsertRow + i, i + 1, student));
      console.log(`[ECR] [${currentQ}] ✅ Inserted ${maleStudents.length + femaleStudents.length} students`);

      // Write HPS (Highest Possible Score) row for this quarter
      const hpsRow = highestScoreRow !== -1 ? highestScoreRow : (maleInsertRow - 2);
      if (hpsRow > 0 && currentGradesArray.length > 0) {
        const wwHPS: (number | '')[] = new Array(10).fill('');
        const ptHPS: (number | '')[] = new Array(10).fill('');
        for (const g of currentGradesArray) {
          const ww = g.writtenWorkScores ? (Array.isArray(g.writtenWorkScores) ? g.writtenWorkScores : JSON.parse(g.writtenWorkScores as any)) : [];
          const pt = g.perfTaskScores ? (Array.isArray(g.perfTaskScores) ? g.perfTaskScores : JSON.parse(g.perfTaskScores as any)) : [];
          ww.forEach((s: any, i: number) => {
            if (i < 10 && s?.maxScore != null && (wwHPS[i] === '' || (s.maxScore as number) > (wwHPS[i] as number))) wwHPS[i] = s.maxScore;
          });
          pt.forEach((s: any, i: number) => {
            if (i < 10 && s?.maxScore != null && (ptHPS[i] === '' || (s.maxScore as number) > (ptHPS[i] as number))) ptHPS[i] = s.maxScore;
          });
        }
        for (let w = 0; w < 10; w++) {
          const col = 6 + w;
          const existing = gradeSheet.row(hpsRow).cell(col).value();
          if ((existing === undefined || existing === null || existing === '') && wwHPS[w] !== '') gradeSheet.row(hpsRow).cell(col).value(wwHPS[w]);
        }
        for (let p = 0; p < 10; p++) {
          const col = 19 + p;
          const existing = gradeSheet.row(hpsRow).cell(col).value();
          if ((existing === undefined || existing === null || existing === '') && ptHPS[p] !== '') gradeSheet.row(hpsRow).cell(col).value(ptHPS[p]);
        }
        const existingQA = gradeSheet.row(hpsRow).cell(32).value();
        if (existingQA === undefined || existingQA === null || existingQA === '') gradeSheet.row(hpsRow).cell(32).value(100);
        console.log(`[ECR] [${currentQ}] HPS row ${hpsRow}: WW=[${wwHPS.filter(v => v !== '').join(',')}] PT=[${ptHPS.filter(v => v !== '').join(',')}] QA=100`);
      }
    } // end for quartersToFill

    // Write to buffer (FAST!)
    const buffer = await workbook.outputAsync();
    const totalTime = Date.now() - startTime;
    const outputFileName = `ECR_${classAssignment.subject.name}_${quarter}_${classAssignment.section.gradeLevel}_${classAssignment.section.name}_${Date.now()}.xlsx`;
    console.log(`[ECR] ✅ Generation completed in ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.send(Buffer.from(buffer));

    createAuditLog(AuditAction.CREATE, buildAuditUser(req), `ECR Generated: ${classAssignment.subject.name} ${quarter}`, 'ECR', `Generated in ${totalTime}ms`, req.ip, AuditSeverity.INFO).catch(err => console.error('[ECR] Audit log failed:', err));
  } catch (error: any) {
    console.error('[ECR] Generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

