-- ===========================================================================
--  Smart Facial Recognition Attendance System  -  Demo seed data (seed.sql)
--  Run AFTER schema.sql.  Makes the dashboards functional out-of-the-box.
--
--  Demo credentials
--  ----------------
--  ADMIN  ->  email: prof.sharma@univ.edu      password: admin123
--  ADMIN  ->  email: prof.iyer@univ.edu         password: admin123
--  STUDENT->  roll: MSC23-001  email: salman.khan@univ.edu
--  STUDENT->  roll: MSC23-002  email: aamir.khan@univ.edu          ... etc.
--  (Students sign in with ROLL NUMBER + EMAIL, no password.)
-- ===========================================================================

-- Clean slate (safe to re-run) ---------------------------------------------
truncate table public.attendance_logs, public.enrollments, public.face_encodings,
               public.students, public.courses, public.admin_users
         restart identity cascade;

-- 1. Admins ----------------------------------------------------------------
insert into public.admin_users (id, full_name, email, password_hash, department) values
 ('11111111-1111-1111-1111-111111111111', 'Prof. Rajesh Sharma', 'prof.sharma@univ.edu',
   crypt('admin123', gen_salt('bf')), 'Computer Science'),
 ('11111111-1111-1111-1111-111111111112', 'Prof. Meera Iyer',    'prof.iyer@univ.edu',
   crypt('admin123', gen_salt('bf')), 'Computer Science');

-- 2. Courses ---------------------------------------------------------------
insert into public.courses (id, course_code, course_name, admin_id) values
 ('22222222-0000-0000-0000-000000000001', 'MSC-CS-501', 'Advanced Machine Learning',
   '11111111-1111-1111-1111-111111111111'),
 ('22222222-0000-0000-0000-000000000002', 'MSC-CS-502', 'Distributed Systems',
   '11111111-1111-1111-1111-111111111111'),
 ('22222222-0000-0000-0000-000000000003', 'MSC-CS-503', 'Computer Vision',
   '11111111-1111-1111-1111-111111111112');

-- 3. Students --------------------------------------------------------------
insert into public.students (id, full_name, roll_number, email, photo_count, is_trained, registered_by) values
 ('33333333-0000-0000-0000-000000000001', 'Salman Khan',   'MSC23-001', 'salman.khan@univ.edu',   5, true,  '11111111-1111-1111-1111-111111111111'),
 ('33333333-0000-0000-0000-000000000002', 'Aamir Khan',    'MSC23-002', 'aamir.khan@univ.edu',    5, true,  '11111111-1111-1111-1111-111111111111'),
 ('33333333-0000-0000-0000-000000000003', 'Priya Menon',   'MSC23-003', 'priya.menon@univ.edu',   5, true,  '11111111-1111-1111-1111-111111111111'),
 ('33333333-0000-0000-0000-000000000004', 'Rahul Verma',   'MSC23-004', 'rahul.verma@univ.edu',   5, true,  '11111111-1111-1111-1111-111111111111'),
 ('33333333-0000-0000-0000-000000000005', 'Ananya Singh',  'MSC23-005', 'ananya.singh@univ.edu',  5, true,  '11111111-1111-1111-1111-111111111112'),
 ('33333333-0000-0000-0000-000000000006', 'Vikram Nair',   'MSC23-006', 'vikram.nair@univ.edu',   0, false, '11111111-1111-1111-1111-111111111112'),
 ('33333333-0000-0000-0000-000000000007', 'Fatima Sheikh', 'MSC23-007', 'fatima.sheikh@univ.edu', 5, true,  '11111111-1111-1111-1111-111111111112');

-- 4. Enrollments  (every student -> ML course; subset -> others) -----------
insert into public.enrollments (student_id, course_id)
select s.id, '22222222-0000-0000-0000-000000000001'
from public.students s;

insert into public.enrollments (student_id, course_id) values
 ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002'),
 ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002'),
 ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003'),
 ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000003');

-- 5. Sample face encodings (placeholder 128-d zero vectors for trained users)
--    The real backend overwrites these with genuine vectors on photo upload.
insert into public.face_encodings (student_id, encoding, image_path)
select s.id,
       (select array_agg(0.0::double precision) from generate_series(1,128)),
       'seed/' || s.roll_number || '_1.jpg'
from   public.students s
where  s.is_trained = true;

-- 6. Attendance history  (last 10 working days for the ML course) ----------
--    Generates a realistic present/absent pattern for the visualiser.
insert into public.attendance_logs (student_id, course_id, attendance_date, status, confidence, marked_by)
select s.id,
       '22222222-0000-0000-0000-000000000001'::uuid,
       d::date,
       case when (random() < 0.82) then 'present' else 'absent' end,
       round((0.30 + random()*0.25)::numeric, 4),
       '11111111-1111-1111-1111-111111111111'::uuid
from   public.students s
cross  join generate_series(current_date - interval '13 days', current_date, interval '1 day') as d
where  s.is_trained = true
  and  extract(dow from d) not in (0,6)          -- skip weekends
on conflict (student_id, course_id, attendance_date) do nothing;

-- Done. Verify with:
--   select * from public.v_attendance_report order by attendance_date desc;
