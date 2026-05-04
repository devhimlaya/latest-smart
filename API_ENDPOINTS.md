# API Endpoints - Grading System
## Microservices Integration

**Your System:** Grading & Academic Records  
**Your IP:** `100.93.66.120` (laptop-pfvh73qk)  
**Your Port:** `3000` (or whatever port you use)

---

## ⚠️ Current Status (Updated: 2026-04-17)

**Team Systems Identified (All on port 3000):**
- ✅ **dev-jegs** (100.120.169.123:3000) = **Enrollment System** - ⚠️ **OFFLINE** (needs to start server)
- ✅ **njgrm** (100.88.55.125:3000) = **Scheduling System** - ⚠️ **OFFLINE** (only database running on 8080)
- ✅ **tfrog** (100.92.245.14:3000) = **Learning Management System** - ⚠️ **OFFLINE** (needs to start server)
- ✅ **You** (100.93.66.120:3000) = **Grading & Academic Records** - Ready to test!

**Critical Need:** 
1. 🔴 **dev-jegs to come online** (you need both enrollments AND student data from them!)
2. 🟡 Other teams (njgrm, tfrog) to start their servers
3. 🟡 Test Tailscale connectivity once servers are up

**Next Action:** Post the Discord message below to get everyone online!

---

## 🔵 APIs YOU PROVIDE (Other teams can call these)

### 1. Get Student Grades by LRN
```
GET http://100.93.66.120:3000/api/grades/student/:lrn
```

**Purpose:** Get all grades for a specific student

**Parameters:**
- `lrn` - Student's Learner Reference Number (in URL)

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "subject": "Mathematics",
      "subjectCode": "MATH7",
      "quarter": "Q1",
      "schoolYear": "2025-2026",
      "writtenWorkPs": 85.5,
      "perfTaskPs": 88.0,
      "quarterlyAssessPs": 82.0,
      "initialGrade": 85.35,
      "quarterlyGrade": 86,
      "remarks": "Passed"
    },
    {
      "subject": "English",
      "subjectCode": "ENG7",
      "quarter": "Q1",
      "schoolYear": "2025-2026",
      "writtenWorkPs": 90.0,
      "perfTaskPs": 88.5,
      "quarterlyAssessPs": 85.0,
      "initialGrade": 88.15,
      "quarterlyGrade": 89,
      "remarks": "Passed"
    }
  ]
}
```

---

### 2. Get Section Grades
```
GET http://100.93.66.120:3000/api/grades/section/:sectionId?quarter=Q1
```

**Purpose:** Get all student grades for a section

**Parameters:**
- `sectionId` - Section ID (in URL)
- `quarter` - Q1, Q2, Q3, or Q4 (query parameter)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sectionId": "section-123",
    "sectionName": "Einstein",
    "gradeLevel": "GRADE_7",
    "quarter": "Q1",
    "students": [
      {
        "lrn": "123456789012",
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "initialGrade": 85.35,
        "quarterlyGrade": 86,
        "remarks": "Passed"
      },
      {
        "lrn": "123456789013",
        "firstName": "Maria",
        "lastName": "Santos",
        "initialGrade": 90.50,
        "quarterlyGrade": 91,
        "remarks": "Passed"
      }
    ]
  }
}
```

---

### 3. Get Class Record
```
GET http://100.93.66.120:3000/api/class-records/:classAssignmentId
```

**Purpose:** Get complete class record (for printing/reports)

**Parameters:**
- `classAssignmentId` - Class assignment ID (in URL)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "teacher": "Mr. John Doe",
    "subject": "Mathematics",
    "section": "Einstein - Grade 7",
    "schoolYear": "2025-2026",
    "students": [
      {
        "lrn": "123456789012",
        "name": "Dela Cruz, Juan C.",
        "quarters": {
          "Q1": { "initialGrade": 85.35, "quarterlyGrade": 86 },
          "Q2": { "initialGrade": 87.20, "quarterlyGrade": 88 },
          "Q3": null,
          "Q4": null
        },
        "finalGrade": null
      }
    ]
  }
}
```

---

## 🟢 APIs YOU NEED (What you will call from other teams)

### Team Member IPs (from Tailscale):
- **dev-jegs** (100.120.169.123:3000) - System: `Enrollment` ⚠️ OFFLINE (server not started)
- **njgrm** (100.88.55.125:3000) - System: `Scheduling` ⚠️ OFFLINE (API not started, only database on 8080)
- **tfrog** (100.92.245.14:3000) - System: `Learning Management System` ⚠️ OFFLINE (server not started)

**Assumption:** All teams using port **3000** (standard Node.js dev port)

**Status:** ❌ No API servers are running yet - teams need to start their servers!

**What to do:**
1. Ask in Discord: "Can everyone start their servers? I'm trying to test Tailscale connectivity."
2. Test command: `Invoke-WebRequest -Uri "http://100.120.169.123:3000" -UseBasicParsing`

---

### 1. Get Students/Learners (FROM: dev-jegs - Enrollment System) 🎯 PRIORITY

**Team:** dev-jegs (100.120.169.123:3000) - **Currently OFFLINE**

✅ **CONFIRMED:** dev-jegs has the student/learner master data!

**Ask dev-jegs when they're back online:**
1. Can you start your server? (npm run dev)
2. What endpoint gives me student/learner data? (/api/learners? /api/students?)
3. What fields do you have available?

```
GET http://100.120.169.123:3000/api/learners
```

**What you need:**
```json
[
  {
    "lrn": "123456789012",
    "firstName": "Juan",
    "middleName": "Cruz",
    "lastName": "Dela Cruz",
    "suffix": null,
    "birthDate": "2010-05-15",
    "gender": "Male",
    "address": "123 Main St, City",
    "guardianName": "Maria Dela Cruz",
    "guardianContact": "09171234567"
  }
]
```

**Optional parameters:**
- `?updatedSince=2026-04-17T00:00:00Z` - Get only recently updated students

---

### 2. Get Enrollments (FROM: dev-jegs - Enrollment System) 🎯 PRIORITY

**Team:** dev-jegs (100.120.169.123:3000) - **Currently OFFLINE**

**Ask dev-jegs when they're back online:**
1. Can you start your server? (npm run dev)
2. What endpoint gives me enrollments? (/api/enrollments?)
3. Do you also have student/learner data, or just enrollments?

```
GET http://100.120.169.123:3000/api/enrollments?schoolYear=2025-2026
```

**What you need:**
```json
[
  {
    "lrn": "123456789012",
    "sectionId": "section-abc-123",
    "sectionName": "Einstein",
    "gradeLevel": "GRADE_7",
    "schoolYear": "2025-2026",
    "status": "ENROLLED"
  }
]
```

**Why you need this:**
- To know which students are in which sections
- To link students to your class assignments for grading

---

### 3. Get Sections (FROM: njgrm or tfrog?)

**Which team has this?** ⚠️ **NEED TO ASK**
- njgrm = Scheduling System (likely has sections/schedules!)
- tfrog = Learning Management System (might also have sections)

**Ask njgrm:** "Do you have sections/grade levels data? What endpoint?"

```
GET http://100.88.55.125:3000/api/sections?schoolYear=2025-2026
```

**What you need:**
```json
[
  {
    "id": "section-abc-123",
    "name": "Einstein",
    "gradeLevel": "GRADE_7",
    "schoolYear": "2025-2026",
    "adviserId": "teacher-xyz-456",
    "adviserName": "Mr. John Doe"
  }
]
```

**Why you need this:**
- To display section names in your grading interface
- To link class assignments to sections

---

## 📋 Questions to Ask Other Teams (Copy to Discord)

```
Hey team! 👋

I've mapped out who has what system. Can everyone start their servers so we can test Tailscale?

**Systems Identified (All on port 3000):**
- dev-jegs (100.120.169.123:3000) = Enrollment System ⚠️ OFFLINE
- njgrm (100.88.55.125:3000) = Scheduling System ⚠️ OFFLINE
- tfrog (100.92.245.14:3000) = Learning Management System ⚠️ OFFLINE
- Me (100.93.66.120:3000) = Grading & Academic Records ✅ READY

**Can everyone please:**
1. Start your server (cd server && npm run dev)
2. Reply when it's running so I can test
3. Share your main API endpoints

**Specific questions:**

**@dev-jegs (Enrollment + Student Data):** 🔥 PRIORITY!
- Endpoint for students/learners? (GET /api/learners? /api/students?)
- Endpoint for enrollments? (GET /api/enrollments?)
- You have BOTH the data we need most!

**@njgrm (Scheduling):**
- Endpoint for sections? (GET /api/sections?)
- What grade levels and school years do you manage?

**@tfrog (Learning Management):**
- What endpoints do you have?
- What data can you share?

**What I need for grading:**
🎯 Student/learner data (LRN, firstName, lastName) ← FROM dev-jegs ✅
🎯 Enrollments (which students in which sections) ← FROM dev-jegs ✅
🎯 Sections (section names, grade levels) ← FROM njgrm (probably)

**What I provide:**
✅ Student grades by LRN: GET /api/grades/student/:lrn
✅ Class records by section: GET /api/grades/section/:sectionId

Let's test Tailscale once everyone's servers are running! 🚀
```

---

## 🔧 How to Test APIs

### ⚡ Quick Test (Run the script):
```powershell
# Just run this script to test all servers at once
.\test-tailscale-servers.ps1
```

### Manual test - Check if all team servers are running:
```powershell
# Test all teams at once (port 3000)
$teams = @(
    @{name="dev-jegs"; ip="100.120.169.123"},
    @{name="njgrm"; ip="100.88.55.125"},
    @{name="tfrog"; ip="100.92.245.14"}
)

foreach($team in $teams) {
    Write-Host "`nTesting $($team.name)..."
    try {
        $response = Invoke-WebRequest -Uri "http://$($team.ip):3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ $($team.name) is ONLINE!" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($team.name) is OFFLINE" -ForegroundColor Red
    }
}
```

### Test a specific team's API endpoint:
```powershell
# Once servers are running, test their actual endpoints
# Example: Test dev-jegs enrollment endpoint
Invoke-WebRequest -Uri "http://100.120.169.123:3000/api/enrollments" -UseBasicParsing | Select-Object -Expand Content

# Or get formatted JSON
$response = Invoke-WebRequest -Uri "http://100.120.169.123:3000/api/enrollments" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Test YOUR API (so others can test calling you):
```powershell
# Make sure your server is running first
# cd server
# npm run dev

# Then from another PowerShell window:
Invoke-WebRequest -Uri "http://100.93.66.120:3000/api/grades/student/123456789012" -UseBasicParsing

# Or test from browser:
# http://100.93.66.120:3000/api/grades/student/123456789012
```

---

## 📝 Integration Checklist

### ✅ Done:
- [x] Set up Tailscale connection
- [x] Found team member IPs
- [x] Identified team systems:
  - dev-jegs = Enrollment System
  - njgrm = Scheduling System
  - tfrog = Learning Management System
- [x] Created API documentation
- [x] Confirmed all teams using port 3000

### 🔄 In Progress (BLOCKED - Waiting for teams to start servers):
- [ ] **CRITICAL:** dev-jegs to start their server (you need BOTH students AND enrollments from them!)
- [ ] **WAITING:** njgrm to start their server (for sections data)
- [ ] **WAITING:** tfrog to start their server
- [x] ✅ Confirmed dev-jegs has student/learner master data!

### ⏳ To Do (Once servers are up):
- [ ] Run the test PowerShell script to check all servers
- [ ] Test calling dev-jegs: GET /api/learners (or /api/students)
- [ ] Test calling dev-jegs: GET /api/enrollments
- [ ] Test calling njgrm: GET /api/sections
- [ ] Get sample JSON responses from each system
- [ ] Build integration code to fetch students from dev-jegs
- [ ] Build integration code to fetch enrollments from dev-jegs
- [ ] Build integration code to fetch sections from njgrm
- [ ] Set up scheduled sync jobs (every 10-30 minutes)
- [ ] Let other teams test calling your grade APIs
- [ ] Document the final working endpoints

---

## 💡 Simple Example Code

### Calling dev-jegs API (fetch students AND enrollments):

**Fetch Students:**
```typescript
// In your code (server/src/services)
import axios from 'axios';

async function fetchStudentsFromDevJegs() {
  try {
    const response = await axios.get('http://100.120.169.123:3000/api/learners');
    const students = response.data;
    
    // Save to your database
    for (const student of students) {
      await prisma.student.upsert({
        where: { lrn: student.lrn },
        update: {
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          suffix: student.suffix,
          birthDate: student.birthDate ? new Date(student.birthDate) : null,
          gender: student.gender,
          address: student.address,
          guardianName: student.guardianName,
          guardianContact: student.guardianContact
        },
        create: {
          lrn: student.lrn,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
          suffix: student.suffix,
          birthDate: student.birthDate ? new Date(student.birthDate) : null,
          gender: student.gender,
          address: student.address,
          guardianName: student.guardianName,
          guardianContact: student.guardianContact
        }
      });
    }
    
    console.log(`✅ Synced ${students.length} students from dev-jegs`);
  } catch (error) {
    console.error('❌ Failed to fetch students:', error.message);
  }
}
```

**Fetch Enrollments:**
```typescript
async function fetchEnrollmentsFromDevJegs(schoolYear: string) {
  try {
    const response = await axios.get(
      `http://100.120.169.123:3000/api/enrollments`,
      { params: { schoolYear } }
    );
    const enrollments = response.data;
    
    // Save to your database
    for (const enrollment of enrollments) {
      await prisma.enrollment.upsert({
        where: {
          studentId_sectionId_schoolYear: {
            studentId: enrollment.studentId,
            sectionId: enrollment.sectionId,
            schoolYear: schoolYear
          }
        },
        update: {
          status: enrollment.status
        },
        create: {
          studentId: enrollment.studentId,
          sectionId: enrollment.sectionId,
          schoolYear: schoolYear,
          status: enrollment.status
        }
      });
    }
    
    console.log(`✅ Synced ${enrollments.length} enrollments`);
  } catch (error) {
    console.error('❌ Failed to fetch enrollments:', error.message);
  }
}

// Sync both from dev-jegs
async function syncFromDevJegs() {
  await fetchStudentsFromDevJegs();
  await fetchEnrollmentsFromDevJegs('2025-2026');
}

syncFromDevJegs();
```

---

## 🎯 Summary

**Your System:** Grading & Academic Records (100.93.66.120:3000)

**You provide (others call you):**
- ✅ GET /api/grades/student/:lrn - Student grades by LRN
- ✅ GET /api/grades/section/:sectionId?quarter=Q1 - Section grades
- ✅ GET /api/class-records/:classAssignmentId - Class records

**You need (you call others) - All on port 3000:**
- 🎯 **Student/Learner data** → FROM dev-jegs (100.120.169.123:3000) ⚠️ OFFLINE - **CONFIRMED!**
- 🎯 **Enrollments** → FROM dev-jegs (100.120.169.123:3000) ⚠️ OFFLINE - **CONFIRMED!**
- 🎯 **Sections** → FROM njgrm (100.88.55.125:3000) ⚠️ OFFLINE (likely)

**Immediate next steps:**
1. ✉️ Post the Discord message above asking everyone to start servers
2. ⏰ **PRIORITY:** Wait for dev-jegs to come online (you need their student + enrollment data!)
3. 🧪 Run the PowerShell test script to check connectivity
4. 📝 Get dev-jegs' exact endpoint names (/api/learners? /api/students? /api/enrollments?)
5. 📝 Get njgrm's sections endpoint
6. 🔗 Once confirmed, build the integration code to sync from dev-jegs
