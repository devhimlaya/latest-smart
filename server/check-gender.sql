SELECT s."lastName", s."firstName", s.gender, COUNT(*) as cnt
FROM "Student" s
JOIN "Enrollment" e ON e."studentId" = s.id
WHERE e.status = 'ENROLLED'
GROUP BY s."lastName", s."firstName", s.gender
ORDER BY s."lastName"
LIMIT 20;

SELECT gender, COUNT(*) as count FROM "Student" GROUP BY gender;

SELECT s."lastName", s."firstName", s.gender, g."quarterlyAssessScore", g."quarterlyAssessMax", g."quarterlyAssessPS"
FROM "Grade" g
JOIN "Student" s ON s.id = g."studentId"
WHERE g.quarter = 'Q1'
ORDER BY s."lastName"
LIMIT 10;
