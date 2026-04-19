export const SAMPLE_SQL = `
-- 員工資料同步流程

SELECT e.id, e.name, e.salary, d.dept_name, l.city
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id
LEFT JOIN locations l ON d.location_id = l.id
WHERE e.status = 'active'
  AND e.salary > 50000
  AND d.region = 'APAC';

INSERT INTO audit_log (action, table_name, record_id, created_at)
SELECT 'EXPORT', 'employees', e.id, SYSDATE
FROM employees e
WHERE e.updated_at > TRUNC(SYSDATE) - 1;

UPDATE employees
SET status = 'inactive', updated_at = SYSDATE
WHERE last_login < SYSDATE - 365
  AND status = 'active';

FOR rec IN (SELECT id, score FROM test_results WHERE processed = 0) LOOP
  INSERT INTO graded_results (id, grade, process_date)
  VALUES (
    rec.id,
    CASE WHEN rec.score >= 90 THEN 'A'
         WHEN rec.score >= 80 THEN 'B'
         WHEN rec.score >= 70 THEN 'C'
         ELSE 'F' END,
    SYSDATE
  );

  UPDATE test_results SET processed = 1 WHERE id = rec.id;
END LOOP;

TRUNCATE TABLE temp_sync_data;

SELECT
  s.student_id,
  s.name,
  AVG(t.score) AS avg_score,
  CASE WHEN AVG(t.score) >= 80 THEN 'Pass' ELSE 'Fail' END AS result
FROM students s
INNER JOIN test_results t ON s.id = t.student_id
INNER JOIN courses c ON t.course_id = c.id
WHERE c.semester = '2025-1'
  AND s.status = 'enrolled'
GROUP BY s.student_id, s.name;

DELETE FROM audit_log
WHERE created_at < SYSDATE - 90;
`.trim();
