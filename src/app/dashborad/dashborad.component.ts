import { Component, OnInit } from '@angular/core';
import { HttpClient ,HttpHeaders} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { ChangeDetectorRef } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core'
import { CookieService } from 'ngx-cookie-service';  // Import the CookieService
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-dashborad',
  standalone: true,
  imports: [CommonModule,
     MatTableModule, 
     MatProgressSpinnerModule,
     MatButtonModule,
     MatCardModule,
     MatTableModule,
     MatSelectModule,
     FormsModule,
     MatGridListModule,
     MatCardModule,
     MatDatepickerModule,
     MatInputModule,
     MatNativeDateModule,
     MatFormFieldModule,
     ReactiveFormsModule,
     MatCheckboxModule],
     
  templateUrl: './dashborad.component.html',
  styleUrl: './dashborad.component.scss'
})
export class DashboradComponent implements OnInit{
  displayedColumns: string[] = ['teams', 'orders', 'allocated', 'status'];
  dataSource: any[] = [];
  isLoading = true;
  taskOption: string | null = null;
  showFileInput = false;
  selectedFile: File | null = null;
  selectedDateRange: string = 'today'; // Default to "Today"
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;
  username: string = ''; 
  initials: string = ''; 
  loading: boolean = false;

  totalLeadsAllocated: number = 0; // Total allocated leads
  totalLeadsCompleted: number = 0; // Total completed leads

   card149Leads : number=0;
  card299Leads : number=0;
   card149Profit : number=0;
   card299Profit : number=0;
// Add the global date range variables
selectedStartDate: Date | null = null;
selectedEndDate: Date | null = null;

applyDateFilter(): void {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // Save the selected date range option to localStorage
  localStorage.setItem('selectedDateRange', this.selectedDateRange);

  // Determine the date range based on the selected option
  if (this.selectedDateRange === 'today') {
    const today = new Date();
    startDate = endDate = today;
  } else if (this.selectedDateRange === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = endDate = yesterday;
  } else if (this.selectedDateRange === 'thisWeek') {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startDate = startOfWeek;
    endDate = today;
  } else if (this.selectedDateRange === 'thisMonth') {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate = startOfMonth;
    endDate = today;
  } else if (this.selectedDateRange === 'custom') {
    if (!this.customStartDate || !this.customEndDate) {
      console.warn('Incomplete custom date range!');
      return;
    }
    startDate = new Date(this.customStartDate);
    endDate = new Date(this.customEndDate);

    // Save custom date range as well
    localStorage.setItem('customStartDate', this.customStartDate.toISOString());
localStorage.setItem('customEndDate', this.customEndDate.toISOString());

  }

  // Store the selected date range globally
  this.selectedStartDate = startDate;
  this.selectedEndDate = endDate;

  // Fetch data for the selected date range
  // this.fetchLeadsData(startDate, endDate);

  // // Call method to update allocations based on the selected date range
  // this.updateAllocationsBasedOnDateRange();
}





  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.http.get('http://localhost:5000/api/teams').subscribe({
      next: (data: any) => {
        this.dataSource = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch data', err);
        this.isLoading = false;
      },
    });
  }
  generateToken() {
    console.log('Token generation logic not implemented yet.');
  }
// Close the file upload alert
closeFileUploadAlert() {
  this.showFileUploadAlert = false; // Hide the file upload alert
}
onOptionSelect() {
  this.showFileInput = this.taskOption === 'import';
}

onFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input?.files?.length) {
    this.selectedFile = input.files[0];
    console.log('File selected:', this.selectedFile.name);
  }
}

// Save the uploaded file
onSaveFile() {
  if (!this.selectedFile) {
    console.error('No file selected.');
    return;
  }

  const fileExtension = this.selectedFile.name.split('.').pop()?.toLowerCase();
  if (fileExtension === 'csv') {
    this.processCSV();
    this.loading = true
  } else {
    console.error('Unsupported file format. Please upload a CSV or PDF file.');
  }
}
// File Upload Alert
showFileUploadAlert: boolean = false;
fileUploadAlertMessage: string = '';

// Process CSV file
private processCSV() {
const reader = new FileReader();
reader.onload = () => {
  const csvData = reader.result as string;
  const headers = ['customerId', 'source', 'coupon', 'status', 'orderId', 'link']; // Predefined headers
  const parsedData = this.parseCSV(csvData, headers);

  if (parsedData.length > 5000) {
    console.error('The file contains more than 5000 records. Only the first 5000 will be processed.');
    parsedData.length = 5000; // Truncate to 5000 records
  }

  console.log('Parsed CSV data:', parsedData);

  const httpHeaders = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  // Send data to the backend
  this.http.post('  https://asia-south1-ads-ai-101.cloudfunctions.net/watcho2_api/api/orders ' //  https://asia-south1-ads-ai-101.cloudfunctions.net/watcho2_api/api/orders
    , parsedData, { headers: httpHeaders }).subscribe(
    (response) => {
      this.loading = false
      console.log('Data saved successfully:', response);
      this.fileUploadAlertMessage = 'Data saved successfully!';
      this.showFileUploadAlert = true;
      
    },
    (error) => {
      this.loading = false

      console.error('Error saving data:', error);
      this.fileUploadAlertMessage = 'Error saving data. Please try again.';
      this.showFileUploadAlert = true; // Show the file upload alert
    }
  );
};
reader.readAsText(this.selectedFile!);
}


// Parse CSV data
private parseCSV(csvData: string, headers: string[]): any[] {
  const rows = csvData.split('\n').filter(row => row.trim() !== ''); // Split rows and remove empty lines

  return rows.map((row, rowIndex) => {
    const values = row.split(','); // Split columns by comma
    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() || null; // Map each value to its corresponding header
    });

    // Add default values for optional fields if not present
    record.status = record.status || 'Pending';
    record.paymentStatus = record.paymentStatus || 'Unpaid';
    record.paymentModeBy = record.paymentModeBy || 'Cash';

    return record;
  }).filter(record => record.customerId && record.orderId); // Ensure mandatory fields are present
}


}
