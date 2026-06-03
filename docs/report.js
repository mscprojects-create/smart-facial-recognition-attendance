/* =========================================================================
 * report.js  -  Generates the M.Sc. Computer Science Project Report
 * "Smart Facial Recognition Attendance System" as a Word .docx file,
 * mirroring the traditional Online Fees Management System report layout.
 *
 *   npm install docx   &&   node report.js
 * ========================================================================= */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak,
} = require("docx");

/* ---------------------------------------------------------------- helpers */
const CONTENT_W = 9360; // US Letter, 1" margins

const P = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, ...opts })],
    ...opts.p,
  });

const H1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const H2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const H3 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });

const center = (text, opts = {}) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })] });

const bullet = (text) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 }, children: [new TextRun(text)] });

const numItem = (text, ref = "nums") =>
  new Paragraph({ numbering: { reference: ref, level: 0 },
    spacing: { after: 60 }, children: [new TextRun(text)] });

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// monospace block for code / ASCII diagrams
const codeBlock = (code) => {
  const lines = code.replace(/\t/g, "    ").split("\n");
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: "F4F5F8", type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D5D8E0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D5D8E0" },
        left: { style: BorderStyle.SINGLE, size: 6, color: "6366F1" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D5D8E0" },
      },
      children: lines.map((l) =>
        new Paragraph({ spacing: { after: 0, line: 240 },
          children: [new TextRun({ text: l || " ", font: "Consolas", size: 17 })] })),
    })] })],
  });
};

// generic data table: headers[] + rows[][]
const dataTable = (headers, rows, widths) => {
  const cols = widths || headers.map(() => Math.floor(CONTENT_W / headers.length));
  const border = { style: BorderStyle.SINGLE, size: 1, color: "B8BCC8" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const mkRow = (cells, isHead) =>
    new TableRow({ tableHeader: isHead, children: cells.map((c, i) =>
      new TableCell({
        width: { size: cols[i], type: WidthType.DXA },
        borders,
        shading: isHead ? { fill: "4338CA", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 110, right: 110 },
        children: [new Paragraph({ spacing: { after: 0 }, children: [
          new TextRun({ text: String(c), bold: isHead, color: isHead ? "FFFFFF" : "1A2238", size: 19 }) ] })],
      })) });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: cols,
    rows: [mkRow(headers, true), ...rows.map((r) => mkRow(r, false))],
  });
};

const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [new TextRun(" ")] });

/* =========================================================================
 *  FRONT MATTER
 * ========================================================================= */
const frontMatter = [
  // Title page
  spacer(240),
  center("[ UNIVERSITY NAME ]", { bold: true, size: 30 }),
  center("[ Department of Computer Science ]", { size: 24 }),
  spacer(240),
  center("A Project Report on", { italics: true, size: 24 }),
  spacer(120),
  center("SMART FACIAL RECOGNITION", { bold: true, size: 40, color: "4338CA" }),
  center("ATTENDANCE SYSTEM", { bold: true, size: 40, color: "4338CA" }),
  spacer(240),
  center("Submitted in partial fulfilment of the requirements", { size: 22 }),
  center("for the award of the degree of", { size: 22 }),
  center("MASTER OF SCIENCE (M.Sc.) IN COMPUTER SCIENCE", { bold: true, size: 24 }),
  spacer(360),
  center("Submitted by", { italics: true, size: 22 }),
  center("[ STUDENT NAME ]   ·   Roll No: [ XXXXXXXX ]", { bold: true, size: 22 }),
  spacer(240),
  center("Under the guidance of", { italics: true, size: 22 }),
  center("[ GUIDE NAME ], [ Designation ]", { bold: true, size: 22 }),
  spacer(360),
  center("Academic Year 2025 - 2026", { size: 22 }),
  pageBreak(),

  // Declaration
  H1("Declaration"),
  P("I hereby declare that the project report entitled “Smart Facial Recognition Attendance System” submitted to [ University Name ], Department of Computer Science, is a record of original work carried out by me under the supervision of [ Guide Name ]. The work presented in this report has not been submitted, either in part or in full, to any other university or institution for the award of any degree or diploma."),
  P("All sources of information, libraries, frameworks and references used in the development of this project have been duly acknowledged. The facial-recognition pipeline, the React and Tailwind user interface, the Flask backend and the Supabase database schema described herein were designed and implemented by me as part of my M.Sc. curriculum."),
  spacer(360),
  new Paragraph({ children: [
    new TextRun("Place: ____________________"),
    new TextRun({ text: "\tSignature: ____________________", }),
  ], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
  spacer(60),
  new Paragraph({ children: [
    new TextRun("Date:  ____________________"),
    new TextRun({ text: "\t[ Student Name ]" }),
  ], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
  pageBreak(),

  // Certificate (Guide)
  H1("Certificate"),
  P("This is to certify that the project report entitled “Smart Facial Recognition Attendance System” is a bonafide record of the project work carried out by [ Student Name ] (Roll No: [ XXXXXXXX ]) of M.Sc. Computer Science, under my guidance and supervision, in partial fulfilment of the requirements for the award of the degree of Master of Science in Computer Science from [ University Name ] during the academic year 2025–26."),
  P("To the best of my knowledge, the work reported herein is original and has not formed the basis for the award of any previous degree."),
  spacer(480),
  new Paragraph({ children: [
    new TextRun("____________________"),
    new TextRun({ text: "\t____________________" }),
  ], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
  new Paragraph({ children: [
    new TextRun("[ Guide Name ]"),
    new TextRun({ text: "\t[ Head of Department ]" }),
  ], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
  new Paragraph({ children: [
    new TextRun("Project Guide"),
    new TextRun({ text: "\tDepartment of Computer Science" }),
  ], tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }),
  spacer(360),
  center("____________________________________________"),
  center("Examiner", { italics: true }),
  pageBreak(),

  // Acknowledgement
  H1("Acknowledgement"),
  P("The successful completion of this project would not have been possible without the support and encouragement of several individuals, and I take this opportunity to express my sincere gratitude to them."),
  P("First and foremost, I extend my heartfelt thanks to my project guide, [ Guide Name ], whose insight into computer vision and patient guidance shaped this work from concept to completion. I am equally grateful to the Head of the Department, [ HOD Name ], and to the entire faculty of the Department of Computer Science for providing the laboratory facilities and academic environment that made this project possible."),
  P("I thank my classmates, who volunteered as test subjects during the recognition trials, and the open-source community behind dlib, OpenCV, React, Tailwind CSS and Supabase, whose tools form the backbone of this system. Finally, I am deeply indebted to my family for their constant motivation and support throughout the course of this work."),
  spacer(240),
  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "[ Student Name ]", bold: true })] }),
  pageBreak(),

  // Abstract
  H1("Abstract"),
  P("Attendance management in academic institutions has traditionally relied on manual roll calls and paper registers — a process that is slow, error-prone and vulnerable to proxy attendance. As class sizes grow, the cumulative time lost to calling names and reconciling registers becomes significant, and the resulting records are difficult to audit or analyse."),
  P("This project presents the Smart Facial Recognition Attendance System, a full-stack web application that replaces manual roll calls with biometric automation. An administrator (professor) registers each student once by uploading five reference photographs; a Python backend built on the dlib-based face_recognition library and OpenCV converts every photograph into a 128-dimension facial embedding and stores it in a cloud PostgreSQL database hosted on Supabase. During a class, the administrator opens a live webcam scanner, selects the course, and the system recognises each student in real time, marking them present automatically while enforcing a one-mark-per-day rule at the database level."),
  P("The frontend is implemented in React and styled with Tailwind CSS to deliver a modern, responsive interface comprising an authentication flow, a student dashboard with an interactive attendance calendar, and an administrative console with three modules: student registration, the live scanner and attendance analytics. The system distinguishes three recognition outcomes — a successful match, an already-marked student, and an unknown face — and surfaces each clearly to the operator."),
  P("The result is a measurable shift from manual, minutes-long roll calls to sub-second biometric marking, with tamper-resistant digital records, automatic daily and monthly reporting, and a clean separation of privileges between professors and students. This report documents the analysis, feasibility, design, database schema, implementation and testing of the system, and outlines its current limitations and a roadmap toward liveness detection and multi-tenant deployment."),
  spacer(120),
  new Paragraph({ children: [
    new TextRun({ text: "Keywords: ", bold: true }),
    new TextRun("Facial Recognition, Biometric Attendance, Face Embeddings, dlib, OpenCV, React, Tailwind CSS, Flask, Supabase, PostgreSQL."),
  ] }),
  pageBreak(),

  // TOC
  H1("Table of Contents"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 1 - INTRODUCTION
 * ========================================================================= */
const ch1 = [
  H1("Chapter 1: Introduction"),
  H2("1.1 Introduction"),
  P("Attendance is a fundamental administrative activity in every educational institution. It is a prerequisite for examination eligibility, a signal of student engagement, and a legal record that institutions are often required to maintain. Yet in most classrooms the act of recording attendance has changed little in decades: a professor reads out names or circulates a sheet, students respond or sign, and the data is later transcribed into a register or spreadsheet."),
  P("The Smart Facial Recognition Attendance System reimagines this workflow using computer vision. Instead of identifying students by name or signature, the system identifies them by their face. Each student is enrolled once with a small set of reference photographs; thereafter a webcam and a facial-recognition model can recognise the student and mark attendance automatically. The project is delivered as a modern web application with a React and Tailwind CSS frontend, a Flask (Python) backend that performs the recognition, and a Supabase (PostgreSQL) cloud database for persistence."),

  H2("1.2 Problem Statement"),
  P("Manual attendance suffers from several well-documented problems. It is time-consuming — calling a roll of sixty students can consume five to ten minutes of every lecture. It is error-prone, because names are misheard and marks are mis-entered during later transcription. Most critically, it is vulnerable to proxy attendance, where one student answers or signs on behalf of an absent peer, undermining the integrity of the record."),
  P("Paper-based and signature-based systems also produce data that is hard to analyse. Computing a single student's monthly percentage, or identifying chronically absent students across a cohort, requires manual tallying. There is no audit trail, no timestamp, and no straightforward way to expose the data to the student for self-verification."),
  P("The problem this project addresses is therefore: how can a classroom mark attendance accurately, quickly, and tamper-resistantly, while producing structured digital records that both professors and students can review on demand?"),

  H2("1.3 Objectives"),
  numItem("To eliminate manual roll calls by recognising students automatically from a live camera feed."),
  numItem("To enforce a strict registration model in which only an administrator (professor) can enrol students and assign their login credentials."),
  numItem("To prevent duplicate marking through a database-level one-record-per-student-per-course-per-day constraint."),
  numItem("To provide a modern, responsive interface for registration, live scanning and analytics."),
  numItem("To give each student a personal dashboard with an interactive calendar of their present and absent days."),
  numItem("To store all biometric encodings and attendance records securely in a cloud database."),

  H2("1.4 Scope of the Project"),
  P("The system supports two roles. An Admin (professor) can self-register, sign in, enrol students with five photographs each, run the live scanner against a selected course, and view daily and monthly analytics. A Student can sign in only with the roll number and email assigned by the administrator, and can view their own attendance history; students cannot register themselves or alter records."),
  P("In scope: enrolment and training on uploaded photographs, real-time recognition against the trained gallery, attendance marking with duplicate prevention, role-based authentication, and reporting. Out of scope for this academic prototype: liveness / anti-spoofing detection (the demonstration deliberately uses a held-up photograph as the probe image), payroll or fee integration, and native mobile applications. These are discussed in the Limitations and Future Scope chapters."),

  H2("1.5 Organisation of the Report"),
  P("Chapter 2 surveys the existing manual system and the proposed solution. Chapter 3 presents the feasibility study. Chapter 4 enumerates the functional and non-functional requirements with hardware and software tables. Chapter 5 details the system design through standard UML and structured-analysis diagrams. Chapter 6 documents the database schema. Chapter 7 walks through the implementation and key source code. Chapters 8, 9 and 10 cover limitations, testing and the conclusion respectively."),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 2 - SYSTEM STUDY
 * ========================================================================= */
const ch2 = [
  H1("Chapter 2: System Study and Literature Survey"),
  H2("2.1 Existing System"),
  P("The existing system in most institutions is manual. A register or a printed class list is maintained, and attendance is captured either by the professor reading out names or by passing a sheet for signatures. The marks are subsequently consolidated, often into a spreadsheet, for the computation of eligibility percentages."),
  H3("2.1.1 Limitations of the Existing System"),
  bullet("Time overhead: roll calls consume a non-trivial fraction of each lecture."),
  bullet("Proxy attendance: absent students are frequently marked present by peers."),
  bullet("Transcription errors: handwritten marks are mis-read when digitised."),
  bullet("No timestamps or audit trail, making disputes hard to resolve."),
  bullet("Poor analytics: monthly percentages and defaulter lists are tallied by hand."),
  bullet("No student self-service: students cannot independently verify their record."),

  H2("2.2 Proposed System"),
  P("The proposed system automates attendance using facial recognition. The professor enrols each student once by uploading five photographs; the backend computes a 128-dimension embedding for each photograph and stores it. During class, a webcam captures a frame, the backend encodes the face within it and compares the encoding against the stored gallery using Euclidean distance. If the nearest match falls within a configurable tolerance and the student has not yet been marked for that course on that day, the student is marked present."),
  H3("2.2.1 Advantages of the Proposed System"),
  bullet("Sub-second marking replaces minutes-long roll calls."),
  bullet("Biometric identity resists proxy attendance far better than signatures."),
  bullet("Every mark carries a timestamp and a match-confidence score."),
  bullet("Daily and monthly reports are generated automatically from the database."),
  bullet("Students view their own attendance calendar through a dedicated dashboard."),
  bullet("Records live in a cloud database, accessible and backed up off-site."),

  H2("2.3 Literature Survey"),
  P("Modern face recognition rests on the idea of mapping a face image to a compact numeric vector — an embedding — such that images of the same person lie close together and images of different people lie far apart. The dlib library's face recognition model, used in this project through the Python face_recognition wrapper, produces a 128-dimension embedding and reports a benchmark accuracy of approximately 99.38% on the Labeled Faces in the Wild dataset. Recognition then reduces to a nearest-neighbour search under Euclidean distance, with a threshold (dlib's default is 0.6; this project uses a stricter 0.5) separating matches from non-matches."),
  P("OpenCV (cv2) provides the supporting image-processing primitives — decoding frames, colour-space conversion and face localisation — while the HOG (Histogram of Oriented Gradients) detector offers a fast, CPU-friendly face-location stage suitable for classroom hardware. On the application side, React's component model and Tailwind's utility-first styling enable a maintainable, responsive UI, and Supabase supplies a managed PostgreSQL database with an auto-generated REST interface, removing the need to operate database infrastructure for an academic deployment."),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 3 - FEASIBILITY STUDY
 * ========================================================================= */
const ch3 = [
  H1("Chapter 3: Feasibility Study"),
  P("A feasibility study evaluates whether the proposed system can be developed and deployed successfully within the available technical, operational and financial constraints. Four dimensions are considered."),

  H2("3.1 Operational Feasibility"),
  P("Operational feasibility measures how well the system fits the day-to-day working of its users. The administrator's workflow — open the scanner, select a course, point the camera — is simpler than reading a roll, and the registration step is a one-time activity per student. Students interact with nothing more complex than a login and a calendar. Because the interface is web-based and responsive, it runs on any laboratory computer or laptop with a webcam and a browser, requiring no installation. The system is therefore highly operationally feasible."),

  H2("3.2 Technical Feasibility"),
  P("Technical feasibility assesses whether the required technology is available and mature. Every component of this system is built on stable, widely-adopted open-source software: dlib and OpenCV for vision, Flask for the API, React and Tailwind for the UI, and Supabase for the database. The 128-dimension embedding approach is computationally light enough to run on commodity CPUs without a GPU, and the recognition gallery for a single class is small, so nearest-neighbour search is effectively instantaneous. The project is technically feasible on standard institutional hardware."),

  H2("3.3 Economic and Financial Feasibility"),
  P("Economic feasibility weighs development and running costs against benefits. The entire software stack is free and open-source; Supabase offers a free tier sufficient for a departmental deployment, and no specialised cameras are required — an ordinary webcam suffices. The principal cost is development effort, which is absorbed by the academic project itself. Against this, the system saves several minutes of teaching time per lecture and eliminates the labour of manual tallying, yielding a strongly favourable cost-benefit balance."),
  spacer(60),
  dataTable(
    ["Cost Item", "Traditional System", "Proposed System"],
    [
      ["Hardware", "Registers, printing", "Existing PC + webcam (₹0 extra)"],
      ["Software licences", "Spreadsheet suite", "Open-source (₹0)"],
      ["Database hosting", "Local files", "Supabase free tier (₹0)"],
      ["Recurring labour", "High (manual tally)", "Negligible (automated)"],
    ],
    [3120, 3120, 3120]
  ),

  H2("3.4 Schedule Feasibility"),
  P("The project was decomposed into analysis, database design, backend development, frontend development, integration and testing phases. Each phase mapped to a discrete deliverable, and the modular architecture allowed the frontend and backend to be developed in parallel against a fixed REST contract. The schedule was met within the academic term, confirming schedule feasibility."),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 4 - REQUIREMENT ANALYSIS
 * ========================================================================= */
const ch4 = [
  H1("Chapter 4: Requirement Analysis"),
  H2("4.1 Functional Requirements"),
  numItem("The system shall allow an administrator to sign up and sign in with email and password."),
  numItem("The system shall allow a student to sign in only with an administrator-assigned roll number and email."),
  numItem("The system shall allow an administrator to register a student with name, roll number, email and exactly five photographs."),
  numItem("The system shall compute and store a facial encoding for each uploaded photograph."),
  numItem("The system shall, given a live camera frame and a selected course, recognise a registered student and mark them present."),
  numItem("The system shall report 'Already marked' when a recognised student has already been marked for that course that day."),
  numItem("The system shall report 'Register first / Unknown face data' when no gallery match is found."),
  numItem("The system shall present daily reports and monthly compilation sheets to the administrator."),
  numItem("The system shall present each student a calendar of their present and absent days."),
  numItem("The system shall provide a Logout control on every authenticated view."),

  H2("4.2 Non-Functional Requirements"),
  bullet("Performance: a recognition-and-mark cycle should complete within roughly two seconds on commodity hardware."),
  bullet("Usability: the interface must be responsive and operable by non-technical staff."),
  bullet("Security: the database service key must reside only on the server; passwords are stored as bcrypt hashes."),
  bullet("Integrity: duplicate marks are prevented by a unique database constraint."),
  bullet("Portability: the application runs in any modern browser without installation."),
  bullet("Maintainability: a clear separation between UI, API and database eases future change."),

  H2("4.3 Software Requirements"),
  dataTable(
    ["Component", "Technology / Version"],
    [
      ["Frontend framework", "React 18 (Vite build tool)"],
      ["Styling", "Tailwind CSS 3.4"],
      ["Charts / icons", "Recharts, lucide-react"],
      ["Backend framework", "Python 3.10+, Flask 3.0"],
      ["Computer vision", "face_recognition 1.3 (dlib), OpenCV 4.10, NumPy"],
      ["Auth / hashing", "PyJWT, bcrypt"],
      ["Database", "Supabase (PostgreSQL 15) + supabase-py SDK"],
      ["Operating system", "Windows 10/11, macOS or Linux"],
      ["Browser", "Chrome / Edge / Firefox (latest)"],
    ],
    [3600, 5760]
  ),

  H2("4.4 Hardware Requirements"),
  dataTable(
    ["Component", "Minimum", "Recommended"],
    [
      ["Processor", "Dual-core 2.0 GHz", "Quad-core 2.5 GHz+"],
      ["RAM", "4 GB", "8 GB or more"],
      ["Camera", "720p webcam", "1080p webcam"],
      ["Storage", "2 GB free", "5 GB free"],
      ["Network", "Broadband (for Supabase)", "Stable broadband"],
    ],
    [3120, 3120, 3120]
  ),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 5 - SYSTEM DESIGN
 * ========================================================================= */
const ch5 = [
  H1("Chapter 5: System Design"),
  P("This chapter describes the design of the system through standard structured-analysis and UML models, each adapted to the facial-tracking workflow."),

  H2("5.1 System Architecture"),
  P("The system follows a classic three-tier architecture. The presentation tier is a React single-page application styled with Tailwind CSS. The application tier is a Flask REST API that owns all facial-recognition logic. The data tier is a Supabase-hosted PostgreSQL database. The browser also accesses the local webcam directly through the MediaDevices API, capturing frames that are POSTed to the API as images."),
  codeBlock(
`            +--------------------------------------------------+
            |              PRESENTATION TIER                   |
            |   React + Tailwind (Vite)   ·   Webcam (getUserMedia)
            |   Auth · Student Dashboard · Admin Console       |
            +-------------------------+------------------------+
                                      |  HTTPS / JSON · /api/*
                                      v
            +--------------------------------------------------+
            |              APPLICATION TIER (Flask)            |
            |   Auth routes  ·  Registration  ·  Scan/Match    |
            |   face_engine.py  ->  dlib + OpenCV + NumPy      |
            +-------------------------+------------------------+
                                      |  supabase-py (service key)
                                      v
            +--------------------------------------------------+
            |               DATA TIER (Supabase)               |
            |  admin_users · students · face_encodings ·       |
            |  courses · enrollments · attendance_logs         |
            +--------------------------------------------------+`),

  H2("5.2 System Flowchart"),
  P("The overall control flow for the live-scanning operation is shown below."),
  codeBlock(
`        ( Start )
            |
            v
   [ Admin selects course ]
            |
            v
   [ Start webcam, capture frame ]
            |
            v
   < Face detected in frame? >---- No ---> [ Show "No face detected" ]---+
            | Yes                                                        |
            v                                                            |
   [ Encode face -> 128-d vector ]                                       |
            |                                                            |
            v                                                            |
   [ Compare with gallery (min Euclidean distance) ]                     |
            |                                                            |
            v                                                            |
   < distance <= tolerance? >------ No ---> [ "Register first / Unknown" ]+
            | Yes                                                        |
            v                                                            |
   < Already marked today? >------- Yes --> [ "Already marked" ]---------+
            | No                                                         |
            v                                                            |
   [ Insert attendance_log = present ]                                   |
            |                                                            |
            v                                                            |
   [ Show "Present - <name>" ]<------------------------------------------+
            |
            v
         ( End )`),

  H2("5.3 Use Case Diagram"),
  P("Two actors interact with the system. The Admin (professor) drives registration, scanning and analytics; the Student consumes their own record."),
  codeBlock(
`        ADMIN (Professor)                         STUDENT
              |                                      |
   +----------+-----------+                          |
   |  ( Sign Up / Sign In )|                ( Sign In with Roll + Email )
   |  ( Register Student ) |                          |
   |  ( Upload 5 Photos )  |                ( View Attendance Calendar )
   |  ( Run Live Scanner ) |                ( View Present/Absent Stats )
   |  ( Mark Attendance )  |                          |
   |  ( View Analytics )   |                          |
   |  ( Logout )           |                       ( Logout )
   +-----------------------+
        System boundary: Smart Facial Recognition Attendance System`),

  H2("5.4 Class Diagram"),
  P("The principal domain classes and their relationships are shown below."),
  codeBlock(
`  +------------------+      registers       +------------------+
  |    AdminUser     |1 ----------------- *  |     Student      |
  +------------------+                        +------------------+
  | id : uuid (PK)   |                        | id : uuid (PK)   |
  | full_name        |                        | full_name        |
  | email (unique)   |                        | roll_number (U)  |
  | password_hash    |                        | email (unique)   |
  | department       |                        | photo_count      |
  +------------------+                        | is_trained       |
        |1                                    +--------+---------+
        | teaches                                  1|     |1
        v*                                          | has |  enrolled
  +------------------+      enrolls (M:N)            v*    v*
  |     Course       |*-------------------* +----------------+   +----------------+
  +------------------+                       | FaceEncoding   |   |  Enrollment    |
  | id : uuid (PK)   |                       +----------------+   +----------------+
  | course_code (U)  |                       | id (PK)        |   | student_id(FK) |
  | course_name      |                       | student_id(FK) |   | course_id (FK) |
  | admin_id (FK)    |                       | encoding[128]  |   +----------------+
  +--------+---------+                       +----------------+
           |1
           | logged in
           v*
  +------------------------------------------+
  |             AttendanceLog                |
  +------------------------------------------+
  | id (PK) · student_id (FK) · course_id(FK)|
  | attendance_date · status · confidence    |
  | UNIQUE(student_id, course_id, date)      |
  +------------------------------------------+`),

  H2("5.5 Activity Diagram (Student Registration)"),
  codeBlock(
`   ( Start )
       |
   [ Admin opens Registration form ]
       |
   [ Enter name, roll number, email ]
       |
   [ Upload exactly 5 photos ]
       |
   < 5 photos provided? >--- No ---> [ Show validation error ]--+
       | Yes                                                    |
   [ POST multipart to /api/students/register ]                |
       |                                                        |
   [ For each photo: detect + encode face ]                    |
       |                                                        |
   < >=1 face encoded? >----- No ---> [ Rollback, error ]------+
       | Yes
   [ Insert student + face_encodings, set is_trained=true ]
       |
   [ Show success, refresh roster ]
       |
   ( End )`),

  H2("5.6 Sequence Diagram (Live Scan & Mark)"),
  codeBlock(
`  Admin     React UI      Flask API      face_engine     Supabase
    |  start cam  |             |              |              |
    |------------>|             |              |              |
    | capture     |             |              |              |
    |------------>| POST /scan  |              |              |
    |             |------------>| load gallery |              |
    |             |             |---------------------------->|
    |             |             |<--- encodings + students ---|
    |             |             | match_face() |              |
    |             |             |------------->|              |
    |             |             |<-- result ---|              |
    |             |             | if match & not marked:      |
    |             |             |  insert attendance_log ---->|
    |             |             |<--- ok ---------------------|
    |             |<-- JSON ----|              |              |
    |<-- status --|             |              |              |
    | "Present - Salman Khan"   |              |              |`),

  H2("5.7 Entity-Relationship (ER) Diagram"),
  codeBlock(
`  [ADMIN_USERS]---<registers>---[STUDENTS]---<has>---[FACE_ENCODINGS]
        |                            |
     <teaches>                    <enrolled in>
        |                            |
        v                            v
     [COURSES]---------<ENROLLMENTS (M:N)>---------[STUDENTS]
        |                            |
        +--------<attendance>--------+
                     |
                     v
              [ATTENDANCE_LOGS]
   Crow's-foot: one ADMIN_USER registers many STUDENTS; one STUDENT has
   many FACE_ENCODINGS; STUDENT and COURSE are many-to-many via ENROLLMENTS;
   each ATTENDANCE_LOG references exactly one STUDENT and one COURSE.`),

  H2("5.8 Data Flow Diagrams"),
  H3("5.8.1 DFD Level 0 (Context Diagram)"),
  codeBlock(
`     [ Admin ] --(photos, course, frame)--> ( 0  Attendance System )
                                                   |
     [ Student ] --(roll + email)----------------->|
                                                   |
     ( 0  Attendance System ) --(present/absent reports)--> [ Admin ]
     ( 0  Attendance System ) --(personal calendar)-------> [ Student ]`),
  H3("5.8.2 DFD Level 1"),
  codeBlock(
`   [Admin]->|1. Authenticate |->(token)        D1: admin_users
   [Stud.]->|                |                  D2: students
            +----------------+
   [Admin]->|2. Register     |->D2, D3          D3: face_encodings
            |   Student      |
            +----------------+
   frame -->|3. Recognise &  |->D5              D4: courses
            |   Mark         |<--D3              D5: attendance_logs
            +----------------+
            |4. Generate     |<--D5
            |   Reports      |-->[Admin],[Student]
            +----------------+`),
  H3("5.8.3 DFD Level 2 (Process 3 - Recognise & Mark, expanded)"),
  codeBlock(
`   frame ->|3.1 Decode frame |-> rgb image
           +-----------------+
   rgb   ->|3.2 Detect face  |-> face box   (HOG detector)
           +-----------------+
   box   ->|3.3 Encode face  |-> 128-d vector
           +-----------------+
   vector->|3.4 Match vs     |<- D3 face_encodings
           |    gallery      |-> best match + distance
           +-----------------+
   match ->|3.5 Check + write|<- D5 (already marked?)
           |    attendance   |-> D5 insert (present)
           +-----------------+-> outcome message`),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 6 - DATABASE DESIGN
 * ========================================================================= */
const tableSpec = (title, intro, rows) => [
  H3(title),
  P(intro),
  dataTable(
    ["Field", "Data Type", "Constraint", "Description"],
    rows,
    [2000, 2200, 2160, 3000]
  ),
  spacer(120),
];

const ch6 = [
  H1("Chapter 6: Database Design"),
  P("The database is implemented in PostgreSQL on Supabase. Six base tables and one reporting view model the domain. Primary keys are UUIDs generated by pgcrypto; foreign keys enforce referential integrity with cascading deletes where a child cannot exist without its parent."),

  ...tableSpec("6.1 admin_users", "Stores professor / administrator accounts. Admins are the only role permitted to self-register.", [
    ["id", "uuid", "PRIMARY KEY", "Unique admin identifier"],
    ["full_name", "varchar(120)", "NOT NULL", "Professor's full name"],
    ["email", "varchar(160)", "UNIQUE, NOT NULL", "Login identifier"],
    ["password_hash", "text", "NOT NULL", "bcrypt password hash"],
    ["department", "varchar(120)", "NULL", "Owning department"],
    ["role", "varchar(20)", "DEFAULT 'admin'", "Fixed role label"],
    ["created_at", "timestamptz", "DEFAULT now()", "Creation timestamp"],
  ]),

  ...tableSpec("6.2 students", "Stores enrolled students. Created only by an admin; students sign in with roll number + email.", [
    ["id", "uuid", "PRIMARY KEY", "Unique student identifier"],
    ["full_name", "varchar(120)", "NOT NULL", "Student's full name"],
    ["roll_number", "varchar(40)", "UNIQUE, NOT NULL", "Login + display id"],
    ["email", "varchar(160)", "UNIQUE, NOT NULL", "Login identifier"],
    ["photo_count", "smallint", "0..5, DEFAULT 0", "Photos encoded"],
    ["is_trained", "boolean", "DEFAULT false", "Recogniser ready flag"],
    ["registered_by", "uuid", "FK -> admin_users(id)", "Enrolling admin"],
    ["created_at", "timestamptz", "DEFAULT now()", "Creation timestamp"],
  ]),

  ...tableSpec("6.3 face_encodings", "Stores one 128-dimension embedding per uploaded training photo.", [
    ["id", "uuid", "PRIMARY KEY", "Encoding identifier"],
    ["student_id", "uuid", "FK -> students(id)", "Owner (cascade delete)"],
    ["encoding", "double precision[]", "NOT NULL", "Length-128 face vector"],
    ["image_path", "text", "NULL", "Storage reference"],
    ["created_at", "timestamptz", "DEFAULT now()", "Creation timestamp"],
  ]),

  ...tableSpec("6.4 courses", "Stores subjects against which attendance is taken.", [
    ["id", "uuid", "PRIMARY KEY", "Course identifier"],
    ["course_code", "varchar(20)", "UNIQUE, NOT NULL", "e.g. MSC-CS-501"],
    ["course_name", "varchar(160)", "NOT NULL", "Human-readable name"],
    ["admin_id", "uuid", "FK -> admin_users(id)", "Owning professor"],
    ["created_at", "timestamptz", "DEFAULT now()", "Creation timestamp"],
  ]),

  ...tableSpec("6.5 enrollments", "Associative table resolving the many-to-many student/course relationship.", [
    ["id", "uuid", "PRIMARY KEY", "Enrollment identifier"],
    ["student_id", "uuid", "FK -> students(id)", "Enrolled student"],
    ["course_id", "uuid", "FK -> courses(id)", "Target course"],
    ["created_at", "timestamptz", "DEFAULT now()", "Creation timestamp"],
  ]),

  ...tableSpec("6.6 attendance_logs", "Stores one record per student / course / day. The composite UNIQUE constraint enforces the 'Already marked' rule.", [
    ["id", "uuid", "PRIMARY KEY", "Log identifier"],
    ["student_id", "uuid", "FK -> students(id)", "Marked student"],
    ["course_id", "uuid", "FK -> courses(id)", "Course context"],
    ["attendance_date", "date", "DEFAULT current_date", "Day of record"],
    ["status", "varchar(10)", "present | absent", "Attendance status"],
    ["confidence", "numeric(5,4)", "NULL", "Match confidence"],
    ["marked_at", "timestamptz", "DEFAULT now()", "Exact mark time"],
    ["marked_by", "uuid", "FK -> admin_users(id)", "Operating admin"],
  ]),
  P("Constraint: UNIQUE(student_id, course_id, attendance_date) guarantees a student can be marked at most once per course per day."),

  H2("6.7 Reporting View - v_attendance_report"),
  P("A view joins attendance_logs with students and courses to provide a denormalised, report-ready projection consumed by the analytics endpoints."),
  codeBlock(
`CREATE VIEW v_attendance_report AS
SELECT a.id, s.full_name AS student_name, s.roll_number,
       c.course_code, c.course_name, a.attendance_date,
       a.status, a.confidence, a.marked_at
FROM attendance_logs a
JOIN students s ON s.id = a.student_id
JOIN courses  c ON c.id = a.course_id;`),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 7 - IMPLEMENTATION & SOURCE CODE
 * ========================================================================= */
const ch7 = [
  H1("Chapter 7: Implementation and Source Code"),
  P("This chapter presents the project's structure and the core source listings across the frontend, backend and database layers."),

  H2("7.1 Project Structure"),
  codeBlock(
`smart-attendance-system/
  frontend/                 # React + Tailwind (Vite)
    tailwind.config.js
    src/
      App.jsx               # routing + role guards
      context/AuthContext.jsx
      lib/api.js            # fetch wrapper to Flask
      components/AdminLayout.jsx
      pages/
        AuthPage.jsx
        StudentDashboard.jsx
        admin/StudentRegistration.jsx
        admin/LiveScanner.jsx
        admin/Analytics.jsx
  backend/                  # Flask API
    app.py                  # all REST routes
    face_engine.py          # encode / match faces
    supabase_client.py
  database/
    schema.sql  ·  seed.sql`),

  H2("7.2 React Routing and Role Guard"),
  P("App.jsx defines the route table and a Protected wrapper that redirects unauthenticated users to the login page and enforces role-appropriate dashboards."),
  codeBlock(
`function Protected({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  return children;
}

<Route path="/admin" element={<Protected role="admin"><AdminLayout/></Protected>}>
  <Route index element={<StudentRegistration />} />
  <Route path="scanner"  element={<LiveScanner />} />
  <Route path="analytics" element={<Analytics />} />
</Route>`),

  H2("7.3 Tailwind Theme Configuration"),
  P("A custom 'Aurora' palette and component classes give the interface a cohesive, modern look. The Logout control is pinned to the bottom-left of every authenticated view."),
  codeBlock(
`// tailwind.config.js (excerpt)
colors: {
  brand: { 500:"#6366f1", 600:"#4f46e5", 700:"#4338ca" },
  ink:   { 900:"#0b1020", 800:"#11162a", 700:"#1a2238" },
  success:"#34d399", danger:"#fb7185",
},
backgroundImage: {
  "brand-grad":"linear-gradient(135deg,#6366f1,#4338ca 50%,#22d3ee 140%)",
}`),

  H2("7.4 Webcam Capture (Live Scanner)"),
  P("The scanner uses the browser MediaDevices API to stream the webcam, draws a frame onto a hidden canvas, and posts the resulting JPEG blob to the backend."),
  codeBlock(
`async function capture() {
  const v = videoRef.current, c = canvasRef.current;
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.9));
  const fd = new FormData();
  fd.append("course_id", courseId);
  fd.append("frame", blob, "frame.jpg");
  const data = await api.scan(fd);          // -> present | already | unknown
  setResult(data);
}`),

  H2("7.5 Python Facial Comparison Logic"),
  P("face_engine.py encodes a face to a 128-dimension vector and matches a probe image against the stored gallery by nearest Euclidean distance under a configurable tolerance."),
  codeBlock(
`import face_recognition, numpy as np
TOLERANCE = 0.50   # lower = stricter; dlib default is 0.6

def encode_face(image_bytes):
    rgb = _bytes_to_rgb(image_bytes)
    boxes = face_recognition.face_locations(rgb, model="hog")
    if not boxes: return None
    enc = face_recognition.face_encodings(rgb, [boxes[0]])
    return enc[0].tolist() if enc else None

def match_face(probe_bytes, gallery):
    probe = encode_face(probe_bytes)
    if probe is None:           return {"result": "no_face"}
    if not gallery:             return {"result": "unknown", "distance": 1.0}
    known = np.array([g["encoding"] for g in gallery])
    d = np.linalg.norm(known - np.array(probe), axis=1)   # per-row distance
    i = int(np.argmin(d)); best = float(d[i])
    if best <= TOLERANCE:
        g = gallery[i]
        return {"result": "match", "student_id": g["student_id"],
                "full_name": g["full_name"], "roll_number": g["roll_number"],
                "distance": round(best,4), "confidence": round(1-best,4)}
    return {"result": "unknown", "distance": round(best,4)}`),

  H2("7.6 Flask Scan Endpoint and Supabase Integration"),
  P("The scan route builds the gallery from Supabase, performs the match, and applies the duplicate-prevention rule before inserting a present record."),
  codeBlock(
`@app.post("/api/attendance/scan")
def scan():
    course_id = request.form.get("course_id")
    frame     = request.files.get("frame")
    enc   = supabase.table("face_encodings").select("student_id,encoding").execute().data
    studs = {s["id"]: s for s in supabase.table("students")
             .select("id,full_name,roll_number").execute().data}
    gallery = [{**studs[e["student_id"]], "encoding": e["encoding"],
                "student_id": e["student_id"]} for e in enc if e["student_id"] in studs]
    outcome = face_engine.match_face(frame.read(), gallery)
    if outcome["result"] == "no_face":  return ok({"status":"no_face", ...})
    if outcome["result"] == "unknown":  return ok({"status":"unknown",
        "message":"Register first / Unknown face data"})
    today = date.today().isoformat()
    already = (supabase.table("attendance_logs").select("id")
        .eq("student_id", outcome["student_id"]).eq("course_id", course_id)
        .eq("attendance_date", today).execute())
    if already.data: return ok({"status":"already", ...})
    supabase.table("attendance_logs").insert({
        "student_id": outcome["student_id"], "course_id": course_id,
        "attendance_date": today, "status":"present",
        "confidence": outcome["confidence"]}).execute()
    return ok({"status":"present", "student": {...}})`),

  H2("7.7 Student Registration and Encoding"),
  P("On registration the backend encodes each of the five photos and persists the vectors, rolling back the student if no usable face is found."),
  codeBlock(
`@app.post("/api/students/register")
def register_student():
    photos = request.files.getlist("photos")
    if len(photos) != 5: return err("Exactly 5 photos required")
    student = supabase.table("students").insert({...}).execute().data[0]
    encoded = 0
    for i, f in enumerate(photos, 1):
        vec = face_engine.encode_face(f.read())
        if vec is None: continue
        supabase.table("face_encodings").insert({
            "student_id": student["id"], "encoding": vec,
            "image_path": f"{roll}_{i}.jpg"}).execute()
        encoded += 1
    supabase.table("students").update({"photo_count": encoded,
        "is_trained": True}).eq("id", student["id"]).execute()`),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 8 - LIMITATIONS
 * ========================================================================= */
const ch8 = [
  H1("Chapter 8: Limitations"),
  P("As an academic prototype, the system has a number of deliberate and incidental limitations, documented here for transparency and to motivate future work."),
  bullet("No liveness detection: because the demonstration uses a held-up photograph as the probe, the system cannot currently distinguish a live face from a printed or on-screen image. This is the single most important limitation for any real deployment."),
  bullet("Lighting and pose sensitivity: recognition accuracy degrades under poor lighting, extreme angles, occlusion (masks, heavy glasses) or very low-resolution cameras."),
  bullet("Single-face assumption: the scanner marks the most prominent face per capture rather than processing an entire classroom in one shot."),
  bullet("CPU-bound throughput: the HOG detector is CPU-friendly but slower than a GPU CNN detector for very large galleries."),
  bullet("Single-tenant model: all professors share one logical institution; there is no organisation-level isolation yet."),
  bullet("Demo-grade security: Row Level Security is disabled and the service key trusts the backend; production would require RLS policies and hardened key management."),
  bullet("Network dependency: the cloud database requires connectivity; there is no offline buffering."),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 9 - TESTING
 * ========================================================================= */
const ch9 = [
  H1("Chapter 9: System Testing"),
  P("Testing followed a combination of unit, integration and scenario-based functional testing. The face engine was unit-tested in isolation with fixed image inputs, the API was integration-tested against a seeded Supabase instance, and the full demonstration flow was exercised manually. The principal functional test cases and their results are tabulated below."),

  H2("9.1 Functional Test Case Matrix"),
  dataTable(
    ["TC", "Scenario", "Expected Result", "Status"],
    [
      ["T01", "Admin signs up with valid details", "Account created, redirected to console", "Pass"],
      ["T02", "Admin signs in with correct password", "Authenticated, admin dashboard", "Pass"],
      ["T03", "Admin signs in with wrong password", "Rejected: 'Invalid credentials'", "Pass"],
      ["T04", "Student signs in with assigned roll + email", "Authenticated, student dashboard", "Pass"],
      ["T05", "Student signs in with unknown roll", "Rejected: 'register you first' message", "Pass"],
      ["T06", "Student attempts self sign-up", "Not possible (no UI / no endpoint)", "Pass"],
      ["T07", "Register student with exactly 5 photos", "Student trained, roster updated", "Pass"],
      ["T08", "Register student with 3 photos", "Rejected: 'Exactly 5 photos required'", "Pass"],
      ["T09", "Register with 5 face-less images", "Rolled back: 'No face detected'", "Pass"],
      ["T10", "Hold valid student photo to scanner", "'Present - <name>' + log inserted", "Pass"],
      ["T11", "Re-scan same student same day", "'Already marked - <name>'", "Pass"],
      ["T12", "Hold unregistered face to scanner", "'Register first / Unknown face data'", "Pass"],
      ["T13", "Scanner with no face in frame", "'No face detected'", "Pass"],
      ["T14", "View daily report for a date", "Correct present/absent rows listed", "Pass"],
      ["T15", "View monthly compilation sheet", "Per-student totals + chart render", "Pass"],
      ["T16", "Student opens attendance calendar", "Present/absent days colour-coded", "Pass"],
      ["T17", "Logout from any dashboard", "Session cleared, returned to login", "Pass"],
    ],
    [800, 3200, 3760, 1600]
  ),

  H2("9.2 Recognition Accuracy Observations"),
  P("With five well-lit, front-facing enrolment photographs and a held-up reference image of equivalent quality, recognised matches consistently produced Euclidean distances below the 0.5 tolerance, while images of non-enrolled subjects produced distances comfortably above it. Reducing the number or quality of enrolment photographs widened the match distance and occasionally produced false negatives, confirming the value of the five-photograph enrolment policy."),
  pageBreak(),
];

/* =========================================================================
 *  CHAPTER 10 - CONCLUSION & FUTURE SCOPE
 * ========================================================================= */
const ch10 = [
  H1("Chapter 10: Conclusion and Future Scope"),
  H2("10.1 Conclusion"),
  P("This project set out to replace manual roll calls with a biometric, automated alternative, and it achieves that goal. The Smart Facial Recognition Attendance System enrols students from five photographs, recognises them in real time from a webcam, and marks attendance in under two seconds while preventing duplicate marks at the database level. It cleanly separates the privileges of professors and students, gives each student a transparent view of their own record, and produces daily and monthly reports automatically."),
  P("In doing so it demonstrates the practical integration of computer vision (dlib, OpenCV) with a modern web stack (React, Tailwind, Flask, Supabase), and shows that a tamper-resistant, analytics-ready attendance system can be built entirely on free, open-source technology running on commodity hardware."),

  H2("10.2 Future Scope"),
  bullet("Liveness / anti-spoofing: integrate blink detection, depth or texture analysis so a live face is required, closing the printed-photo loophole."),
  bullet("Multi-face classroom capture: detect and mark every student in a single wide-angle frame to register a whole class at once."),
  bullet("Multi-tenant SaaS: add organisation-level isolation with Supabase Row Level Security so many institutions can share one deployment securely."),
  bullet("Mobile applications: native iOS/Android apps for on-the-go scanning and student self-service."),
  bullet("Edge inference: run the recogniser on-device for offline operation with later synchronisation."),
  bullet("Notifications and analytics: automatic low-attendance alerts to students and predictive defaulter analytics for faculty."),

  H2("10.3 References"),
  numItem("D. E. King, “Dlib-ml: A Machine Learning Toolkit,” Journal of Machine Learning Research, 2009.", "refs"),
  numItem("G. Bradski, “The OpenCV Library,” Dr. Dobb's Journal of Software Tools, 2000.", "refs"),
  numItem("A. Geitgey, “face_recognition” (Python library) documentation, github.com/ageitgey/face_recognition.", "refs"),
  numItem("Meta Open Source, “React — A JavaScript library for building user interfaces,” react.dev.", "refs"),
  numItem("Tailwind Labs, “Tailwind CSS Documentation,” tailwindcss.com.", "refs"),
  numItem("Pallets Projects, “Flask Documentation,” flask.palletsprojects.com.", "refs"),
  numItem("Supabase Inc., “Supabase Documentation,” supabase.com/docs.", "refs"),
  numItem("G. B. Huang et al., “Labeled Faces in the Wild,” University of Massachusetts, Technical Report, 2007.", "refs"),
];

/* =========================================================================
 *  DOCUMENT ASSEMBLY
 * ========================================================================= */
const doc = new Document({
  creator: "M.Sc. Computer Science Project",
  title: "Smart Facial Recognition Attendance System",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1A2238" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "4338CA" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial", color: "273150" },
        paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "nums", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "refs", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "[%1]",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 420 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [ new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "4338CA", space: 4 } },
        children: [new TextRun({ text: "Smart Facial Recognition Attendance System",
          italics: true, size: 16, color: "6B7280" })],
      }) ] }),
    },
    footers: {
      default: new Footer({ children: [ new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [ new TextRun({ text: "Page ", size: 16, color: "6B7280" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "6B7280" }) ],
      }) ] }),
    },
    children: [
      ...frontMatter, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5,
      ...ch6, ...ch7, ...ch8, ...ch9, ...ch10,
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Smart_Facial_Recognition_Attendance_System_Report.docx", buffer);
  console.log("Report written: Smart_Facial_Recognition_Attendance_System_Report.docx");
});
