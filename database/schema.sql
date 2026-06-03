-- ===========================================================================
--  Smart Facial Recognition Attendance System
--  PostgreSQL / Supabase schema  (schema.sql)
--  Run this in the Supabase SQL Editor BEFORE seed.sql
-- ===========================================================================

-- Required extensions ------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid(), crypt()

-- ---------------------------------------------------------------------------
-- 1. ADMIN_USERS  (Professors / Administrators)
--    Admins are the only role allowed to self sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
    id            uuid primary key default gen_random_uuid(),
    full_name     varchar(120)        not null,
    email         varchar(160) unique not null,
    password_hash text                not null,          -- bcrypt hash
    department    varchar(120),
    role          varchar(20)         not null default 'admin'
                  check (role in ('admin')),
    created_at    timestamptz         not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. COURSES  (subjects a professor teaches / takes attendance for)
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
    id            uuid primary key default gen_random_uuid(),
    course_code   varchar(20)  unique not null,          -- e.g. MSC-CS-501
    course_name   varchar(160)        not null,
    admin_id      uuid references public.admin_users(id) on delete set null,
    created_at    timestamptz         not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. STUDENTS  (registered ONLY by an admin)
--    Students sign in with roll_number + email (no password self-service).
-- ---------------------------------------------------------------------------
create table if not exists public.students (
    id            uuid primary key default gen_random_uuid(),
    full_name     varchar(120)        not null,
    roll_number   varchar(40)  unique not null,
    email         varchar(160) unique not null,
    photo_count   smallint            not null default 0
                  check (photo_count between 0 and 5),
    is_trained    boolean             not null default false,
    registered_by uuid references public.admin_users(id) on delete set null,
    created_at    timestamptz         not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. FACE_ENCODINGS  (128-d vectors produced by the Python backend)
--    One row per uploaded training photo (up to 5 per student).
-- ---------------------------------------------------------------------------
create table if not exists public.face_encodings (
    id            uuid primary key default gen_random_uuid(),
    student_id    uuid not null references public.students(id) on delete cascade,
    encoding      double precision[] not null,           -- length-128 vector
    image_path    text,                                  -- storage reference
    created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. ENROLLMENTS  (many-to-many student <-> course)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
    id            uuid primary key default gen_random_uuid(),
    student_id    uuid not null references public.students(id) on delete cascade,
    course_id     uuid not null references public.courses(id)  on delete cascade,
    created_at    timestamptz not null default now(),
    unique (student_id, course_id)
);

-- ---------------------------------------------------------------------------
-- 6. ATTENDANCE_LOGS  (one record per student / course / day)
--    The (student_id, course_id, attendance_date) unique constraint
--    enforces the "Already marked" business rule at the DB level.
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_logs (
    id              uuid primary key default gen_random_uuid(),
    student_id      uuid not null references public.students(id) on delete cascade,
    course_id       uuid not null references public.courses(id)  on delete cascade,
    attendance_date date        not null default current_date,
    status          varchar(10) not null default 'present'
                    check (status in ('present','absent')),
    confidence      numeric(5,4),                        -- match distance score
    marked_at       timestamptz not null default now(),
    marked_by       uuid references public.admin_users(id) on delete set null,
    unique (student_id, course_id, attendance_date)
);

-- Helpful indexes ----------------------------------------------------------
create index if not exists idx_attendance_date    on public.attendance_logs (attendance_date);
create index if not exists idx_attendance_student on public.attendance_logs (student_id);
create index if not exists idx_encodings_student  on public.face_encodings   (student_id);
create index if not exists idx_enroll_course      on public.enrollments      (course_id);

-- ---------------------------------------------------------------------------
-- Convenience view: daily attendance with names (used by Analytics module)
-- ---------------------------------------------------------------------------
create or replace view public.v_attendance_report as
select  a.id,
        s.full_name      as student_name,
        s.roll_number,
        c.course_code,
        c.course_name,
        a.attendance_date,
        a.status,
        a.confidence,
        a.marked_at
from    public.attendance_logs a
join    public.students s on s.id = a.student_id
join    public.courses  c on c.id = a.course_id;

-- ===========================================================================
--  NOTE on Row Level Security (RLS)
--  For a classroom demo RLS is left disabled so the anon/service key can
--  read & write freely. For production, enable RLS and add policies such as:
--
--    alter table public.students enable row level security;
--    create policy "admins manage students"
--      on public.students for all
--      using (auth.role() = 'service_role');
-- ===========================================================================
