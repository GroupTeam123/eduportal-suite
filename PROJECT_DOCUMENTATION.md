# Annual Report Generator and Student Management Portal
## Complete Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Frontend Code Structure](#frontend-code-structure)
5. [Backend Code Structure](#backend-code-structure)
6. [File-by-File Documentation](#file-by-file-documentation)
7. [Data Flow](#data-flow)
8. [Security Model](#security-model)

---

## Project Overview

This is an educational management system with a hierarchical access structure:
- **Teachers**: Manage students, generate reports, upload documents
- **HODs (Heads of Department)**: View department data, approve/forward reports
- **Principal**: Access all institutional data, approve final reports

### Key Features
- Student record management with Excel import
- PDF report generation (class-wide and single-student)
- Document storage and management
- Hierarchical report submission workflow
- Role-based access control

---

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Recharts** - Chart visualization
- **jsPDF** - PDF generation

### Backend (Supabase)
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access control
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Edge Functions** - Serverless functions (Deno runtime)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages (UI)  →  Hooks (Logic)  →  Supabase Client (API)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                        │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions  |  PostgreSQL + RLS  |  Storage Buckets    │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Code Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/          # Layout components (sidebar, dashboard)
│   ├── reports/         # Report-related components
│   ├── teacher/         # Teacher-specific components
│   └── ui/              # shadcn/ui base components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks (data fetching)
├── integrations/        # External service integrations
├── pages/               # Route-level page components
│   ├── hod/             # HOD dashboard pages
│   ├── principal/       # Principal dashboard pages
│   └── teacher/         # Teacher dashboard pages
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

---

## Backend Code Structure

```
supabase/
├── config.toml          # Supabase configuration
├── functions/           # Edge functions
│   └── assign-role/     # Role assignment function
└── migrations/          # Database migrations (auto-generated)
```

### Database Tables
- `profiles` - User profile information
- `departments` - Department records
- `user_roles` - User role assignments
- `teacher_assignments` - Teacher-department mappings
- `student_records` - Student data (manual entry)
- `imported_students` - Students imported from Excel
- `reports` - Generated reports
- `documents` - Uploaded document metadata

---

## File-by-File Documentation

### Configuration Files

#### `vite.config.ts`
**Purpose**: Vite build tool configuration
**How it works**:
- Configures React plugin for JSX support
- Sets up path aliases (`@/` → `src/`)
- Configures dev server settings

#### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration
**How it works**:
- Defines custom color tokens using CSS variables
- Extends default theme with project-specific values
- Configures animation utilities

#### `tsconfig.json` / `tsconfig.app.json`
**Purpose**: TypeScript compiler configuration
**How it works**:
- Sets module resolution strategy
- Defines path aliases for imports
- Configures strict type checking

#### `index.html`
**Purpose**: Entry HTML file
**How it works**:
- Provides root DOM element for React
- Loads the main TypeScript entry point

---

### Entry Points

#### `src/main.tsx`
**Purpose**: Application entry point
**How it works**:
- Renders the root React component
- Wraps app with necessary providers (Router, Query, Theme)

#### `src/App.tsx`
**Purpose**: Root component and route configuration
**How it works**:
- Defines all application routes
- Wraps routes with AuthContext provider
- Handles route-based code splitting

#### `src/index.css`
**Purpose**: Global styles and CSS variables
**How it works**:
- Defines color tokens for light/dark themes
- Sets up Tailwind base styles
- Provides design system foundation

---

### Context Providers

#### `src/contexts/AuthContext.tsx`
**Purpose**: Authentication state management
**How it works**:
- Listens to Supabase auth state changes
- Provides current user, role, and department ID
- Exposes login/logout functions
- Fetches user role from `user_roles` table
- Fetches department from `teacher_assignments` or `departments`

---

### Custom Hooks (Data Layer)

#### `src/hooks/useAuth.ts`
**Purpose**: Convenience hook for auth context
**How it works**:
- Re-exports AuthContext for easy consumption
- Provides typed access to auth state

#### `src/hooks/useProfile.ts`
**Purpose**: User profile CRUD operations
**How it works**:
- Fetches profile from `profiles` table
- Provides updateProfile function
- Auto-refetches on user change

#### `src/hooks/useStudents.ts`
**Purpose**: Student record management
**How it works**:
- CRUD operations on `student_records` table
- Filters by teacher_user_id automatically
- Provides bulk import capability

#### `src/hooks/useImportedStudents.ts`
**Purpose**: Excel-imported student management
**How it works**:
- Similar to useStudents but for `imported_students`
- Supports custom fields from Excel columns
- Handles marks and attendance data

#### `src/hooks/useReports.ts`
**Purpose**: Report CRUD and submission
**How it works**:
- Creates reports with `chart_data` JSON
- Updates report status for submission workflow
- Supports draft → submitted_to_hod → submitted_to_principal → approved

#### `src/hooks/useDocuments.ts`
**Purpose**: Document upload/download management
**How it works**:
- Uploads files to Supabase Storage
- Creates metadata records in `documents` table
- Provides download URLs via signed URLs

#### `src/hooks/useDepartments.ts`
**Purpose**: Department data access
**How it works**:
- Fetches all departments
- Used by Principal and HOD views

#### `src/hooks/useHODData.ts`
**Purpose**: HOD-specific aggregated data
**How it works**:
- Fetches department teachers and students
- Aggregates statistics for HOD dashboard

#### `src/hooks/usePrincipalData.ts`
**Purpose**: Principal-specific aggregated data
**How it works**:
- Fetches institution-wide statistics
- Aggregates all departments, teachers, students

---

### Page Components

#### `src/pages/Index.tsx`
**Purpose**: Landing/redirect page
**How it works**:
- Redirects authenticated users to role-specific dashboard
- Shows login for unauthenticated users

#### `src/pages/Login.tsx`
**Purpose**: Authentication page
**How it works**:
- Handles login with email/password
- Handles signup with role selection
- Calls assign-role edge function on signup

#### `src/pages/NotFound.tsx`
**Purpose**: 404 error page
**How it works**:
- Displays when route doesn't match

---

### Teacher Pages

#### `src/pages/teacher/TeacherDashboard.tsx`
**Purpose**: Teacher's main dashboard
**How it works**:
- Shows student statistics cards
- Displays recent activity
- Provides quick actions

#### `src/pages/teacher/TeacherStudents.tsx`
**Purpose**: Student management interface
**How it works**:
- Lists all students with search/filter
- Excel import functionality
- Edit/delete student records

#### `src/pages/teacher/TeacherReports.tsx`
**Purpose**: Report generation interface
**How it works**:
- Chart selection for reports
- PDF preview and generation
- Stores complete report data in `chart_data`
- Submit to HOD functionality

#### `src/pages/teacher/TeacherSubmit.tsx`
**Purpose**: Report submission page
**How it works**:
- Reviews reports before submission
- Updates report status

#### `src/pages/teacher/TeacherProfile.tsx`
**Purpose**: Profile management
**How it works**:
- Edit personal information
- Upload avatar

---

### HOD Pages

#### `src/pages/hod/HODDashboard.tsx`
**Purpose**: HOD's main dashboard
**How it works**:
- Department statistics overview
- Teacher performance metrics

#### `src/pages/hod/HODStudents.tsx`
**Purpose**: View department students
**How it works**:
- Read-only view of all department students
- Filter by teacher

#### `src/pages/hod/HODTeachers.tsx`
**Purpose**: Department teacher list
**How it works**:
- Lists teachers in department
- Shows teacher statistics

#### `src/pages/hod/HODReports.tsx`
**Purpose**: Report management
**How it works**:
- Views submitted reports from teachers
- Preview, approve, forward to Principal
- Downloads exact PDF format from teacher
- Uses stored `chart_data` for PDF generation

#### `src/pages/hod/HODSubmit.tsx`
**Purpose**: HOD's own report creation
**How it works**:
- Creates department summary reports
- Submits directly to Principal

#### `src/pages/hod/HODProfile.tsx`
**Purpose**: HOD profile management

---

### Principal Pages

#### `src/pages/principal/PrincipalDashboard.tsx`
**Purpose**: Principal's main dashboard
**How it works**:
- Institution-wide statistics
- Department comparison charts

#### `src/pages/principal/PrincipalDepartments.tsx`
**Purpose**: Department management
**How it works**:
- Lists all departments
- HOD assignments

#### `src/pages/principal/PrincipalTeachers.tsx`
**Purpose**: All teachers view
**How it works**:
- Institution-wide teacher list
- Filter by department

#### `src/pages/principal/PrincipalHODs.tsx`
**Purpose**: HOD management
**How it works**:
- Lists all HODs
- Department assignments

#### `src/pages/principal/PrincipalReports.tsx`
**Purpose**: Final report approval
**How it works**:
- Views reports submitted by HODs
- Approve/download reports
- Uses stored `chart_data` for exact PDF format

---

### Layout Components

#### `src/components/layout/DashboardLayout.tsx`
**Purpose**: Common dashboard wrapper
**How it works**:
- Provides consistent header and sidebar
- Responsive layout structure

#### `src/components/layout/DashboardSidebar.tsx`
**Purpose**: Navigation sidebar
**How it works**:
- Role-based navigation links
- Active state highlighting
- Logout functionality

---

### Report Components

#### `src/components/teacher/SingleStudentReport.tsx`
**Purpose**: Individual student report generator
**How it works**:
- Selects single student for detailed report
- Includes marks, attendance, custom fields
- Stores all data in `chart_data` for consistency

#### `src/components/reports/ReportPreviewDialog.tsx`
**Purpose**: Report preview modal
**How it works**:
- Shows report metadata
- Chart previews
- Actions (download, approve, delete)

---

### UI Components (`src/components/ui/`)

All shadcn/ui components providing consistent design:
- `button.tsx` - Button variants
- `card.tsx` - Card containers
- `dialog.tsx` - Modal dialogs
- `form.tsx` - Form handling
- `input.tsx` - Text inputs
- `select.tsx` - Dropdown selects
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- `toast.tsx` / `sonner.tsx` - Notifications
- `stat-card.tsx` - Statistics display cards
- And many more...

---

### Utility Functions

#### `src/utils/pdfGenerator.ts`
**Purpose**: PDF document generation
**How it works**:
- `generateAnnualReportPDF()` - Class-wide reports with charts
- `generateSingleStudentReportPDF()` - Individual student reports
- Uses jsPDF and jspdf-autotable
- Includes institution branding, charts, tables

#### `src/utils/excelParser.ts`
**Purpose**: Excel file parsing
**How it works**:
- Parses XLSX files using xlsx library
- Maps columns to student fields
- Handles custom fields dynamically

#### `src/lib/utils.ts`
**Purpose**: General utilities
**How it works**:
- `cn()` - Tailwind class merging
- Common helper functions

---

### Supabase Integration

#### `src/integrations/supabase/client.ts`
**Purpose**: Supabase client initialization
**How it works**:
- Creates typed Supabase client
- Configures auth persistence
- Auto-refreshes tokens

#### `src/integrations/supabase/types.ts`
**Purpose**: Database type definitions (auto-generated)
**How it works**:
- TypeScript types matching database schema
- Ensures type safety for queries

---

### Edge Functions (Backend)

#### `supabase/functions/assign-role/index.ts`
**Purpose**: User role assignment
**How it works**:
- Called during signup
- Validates user exists in auth.users
- Inserts role into user_roles table
- Creates teacher_assignment if teacher role
- Only principals can modify existing roles

---

### Configuration

#### `supabase/config.toml`
**Purpose**: Supabase project configuration
**How it works**:
- Defines project ID
- Edge function settings
- API configuration

---

## Data Flow

### Authentication Flow
```
Login Page → Supabase Auth → AuthContext → Role Fetch → Redirect to Dashboard
```

### Report Submission Flow
```
Teacher Creates Report
    ↓
Stores in `reports` table (status: draft)
    ↓
Teacher Submits to HOD (status: submitted_to_hod)
    ↓
HOD Reviews & Forwards (status: submitted_to_principal)
    ↓
Principal Approves (status: approved)
```

### PDF Generation Flow
```
Teacher Generates PDF → Data stored in chart_data
    ↓
HOD/Principal Downloads → Reads chart_data → Same PDF format
```

---

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with policies based on:
- User's own data (via `auth.uid()`)
- Role-based access (via `has_role()`, `is_hod()`, `is_principal()`)
- Department membership (via `can_access_department()`)

### Role Hierarchy
```
Principal (can access everything)
    ↓
HOD (can access department data)
    ↓
Teacher (can access own data only)
```

### Key Security Functions
- `has_role(user_id, role)` - Checks if user has specific role
- `is_teacher(user_id)` - Checks teacher role
- `is_hod(user_id)` - Checks HOD role
- `is_principal(user_id)` - Checks principal role
- `get_user_department(user_id)` - Gets teacher's department
- `get_hod_department(user_id)` - Gets HOD's department
- `can_access_department(user_id, dept_id)` - Validates department access

---

## Summary

This project follows a clean separation of concerns:

**Frontend**: React components handle UI, custom hooks manage data fetching/mutations, contexts provide global state.

**Backend**: Supabase provides database with RLS for security, storage for files, edge functions for custom logic.

**Data Integrity**: Reports store complete snapshot in `chart_data` ensuring consistent PDF output across all roles.

**Security**: RLS policies enforce role-based access at the database level, preventing unauthorized data access.
