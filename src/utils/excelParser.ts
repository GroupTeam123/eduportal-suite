import * as XLSX from 'xlsx';
import { NewStudentRecord } from '@/hooks/useStudents';

export interface ParsedExcelResult {
  success: boolean;
  data: NewStudentRecord[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

// Expected column headers (case-insensitive matching)
const COLUMN_MAPPINGS: Record<string, keyof NewStudentRecord> = {
  'name': 'name',
  'student name': 'name',
  'full name': 'name',
  'email': 'email',
  'email address': 'email',
  'student email': 'email',
  'contact': 'contact',
  'phone': 'contact',
  'phone number': 'contact',
  'contact number': 'contact',
  'mobile': 'contact',
  'attendance': 'attendance',
  'attendance %': 'attendance',
  'attendance percentage': 'attendance',
  'guardian': 'guardian_name',
  'guardian name': 'guardian_name',
  'parent name': 'guardian_name',
  'parent': 'guardian_name',
  'guardian phone': 'guardian_phone',
  'guardian contact': 'guardian_phone',
  'parent phone': 'guardian_phone',
  'parent contact': 'guardian_phone',
  'notes': 'notes',
  'remarks': 'notes',
  'comments': 'notes',
  'year': 'year',
  'student year': 'year',
  'class year': 'year',
  'academic year': 'year',
  'student id': 'student_id',
  'studentid': 'student_id',
  'roll number': 'student_id',
  'roll no': 'student_id',
  'enrollment': 'student_id',
  'enrollment number': 'student_id',
  'id': 'student_id',
};

function normalizeHeader(header: string): keyof NewStudentRecord | null {
  const normalized = header.toLowerCase().trim();
  return COLUMN_MAPPINGS[normalized] || null;
}

function parseValue(value: unknown, field: keyof NewStudentRecord): unknown {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  switch (field) {
    case 'name':
      return String(value).trim();
    case 'email':
      const email = String(value).trim();
      // Basic email validation
      return email.includes('@') ? email : undefined;
    case 'contact':
      const num = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, ''));
      return isNaN(num) ? undefined : num;
    case 'attendance':
      const att = typeof value === 'number' ? value : parseFloat(String(value).replace('%', ''));
      return isNaN(att) ? 0 : Math.min(100, Math.max(0, att));
    case 'year':
      const year = typeof value === 'number' ? value : parseInt(String(value));
      if (isNaN(year) || year < 1 || year > 4) return 1;
      return year;
    case 'student_id':
      return String(value).trim() || undefined;
    case 'guardian_name':
    case 'guardian_phone':
    case 'notes':
      return String(value).trim() || undefined;
    default:
      return String(value);
  }
}

export function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (jsonData.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['The Excel file is empty or has no data rows.'],
            totalRows: 0,
            validRows: 0,
          });
          return;
        }

        // Get headers from the first row keys
        const headers = Object.keys(jsonData[0] || {});
        
        // Map headers to fields
        const headerMap: Record<string, keyof NewStudentRecord | null> = {};
        headers.forEach((header) => {
          headerMap[header] = normalizeHeader(header);
        });

        // Check if we have at least a name column
        const hasNameColumn = Object.values(headerMap).includes('name');
        if (!hasNameColumn) {
          resolve({
            success: false,
            data: [],
            errors: [
              'Could not find a "Name" column in the Excel file.',
              'Expected columns: Name, Student ID, Year, Email, Contact, Attendance, Guardian Name, Guardian Phone, Notes',
            ],
            totalRows: jsonData.length,
            validRows: 0,
          });
          return;
        }

        const errors: string[] = [];
        const parsedRecords: NewStudentRecord[] = [];

        jsonData.forEach((row, index) => {
          const record: Partial<NewStudentRecord> = {};
          
          headers.forEach((header) => {
            const field = headerMap[header];
            if (field) {
              const value = parseValue(row[header], field);
              if (value !== undefined) {
                (record as Record<string, unknown>)[field] = value;
              }
            }
          });

          // Validate required fields
          if (!record.name || record.name.trim() === '') {
            errors.push(`Row ${index + 2}: Missing student name`);
            return;
          }

          parsedRecords.push({
            name: record.name,
            email: record.email,
            contact: record.contact,
            attendance: record.attendance ?? 0,
            guardian_name: record.guardian_name,
            guardian_phone: record.guardian_phone,
            notes: record.notes,
            year: record.year ?? 1,
            student_id: record.student_id,
          });
        });

        resolve({
          success: parsedRecords.length > 0,
          data: parsedRecords,
          errors,
          totalRows: jsonData.length,
          validRows: parsedRecords.length,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [
            'Failed to parse Excel file.',
            error instanceof Error ? error.message : 'Unknown error occurred.',
          ],
          totalRows: 0,
          validRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Failed to read the file. Please try again.'],
        totalRows: 0,
        validRows: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleExcel(): void {
  const sampleData = [
    {
      'Student ID': 'STU001',
      'Name': 'John Smith',
      'Year': '1',
      'Email': 'john.smith@student.edu',
      'Contact': '9876543210',
      'Attendance': '92',
      'Guardian Name': 'Robert Smith',
      'Guardian Phone': '9876543211',
      'Notes': 'Excellent student',
    },
    {
      'Student ID': 'STU002',
      'Name': 'Jane Doe',
      'Year': '2',
      'Email': 'jane.doe@student.edu',
      'Contact': '9876543212',
      'Attendance': '88',
      'Guardian Name': 'Mary Doe',
      'Guardian Phone': '9876543213',
      'Notes': '',
    },
    {
      'Student ID': 'STU003',
      'Name': 'Mike Johnson',
      'Year': '3',
      'Email': 'mike.j@student.edu',
      'Contact': '9876543214',
      'Attendance': '75',
      'Guardian Name': 'David Johnson',
      'Guardian Phone': '9876543215',
      'Notes': 'Needs improvement in attendance',
    },
    {
      'Student ID': 'STU004',
      'Name': 'Sarah Williams',
      'Year': '4',
      'Email': 'sarah.w@student.edu',
      'Contact': '9876543216',
      'Attendance': '95',
      'Guardian Name': 'Emily Williams',
      'Guardian Phone': '9876543217',
      'Notes': 'Final year student',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Student ID
    { wch: 20 }, // Name
    { wch: 8 },  // Year
    { wch: 25 }, // Email
    { wch: 15 }, // Contact
    { wch: 12 }, // Attendance
    { wch: 20 }, // Guardian Name
    { wch: 15 }, // Guardian Phone
    { wch: 30 }, // Notes
  ];

  XLSX.writeFile(workbook, 'student_import_template.xlsx');
}
