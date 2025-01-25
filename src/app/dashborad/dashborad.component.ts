import { Component, OnInit } from '@angular/core';
import { HttpClient ,HttpHeaders} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
interface TeamCount {
  teamId: string;
  allocatedCount: number;
  completionCount: number;
}

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
     MatCheckboxModule,
    ],
     
  templateUrl: './dashborad.component.html',
  styleUrl: './dashborad.component.scss'
})
export class DashboradComponent implements OnInit{
  displayedColumns: string[] = ['teamId','teams', 'orders', 'allocated', 'status'];
  // dataSource: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  selectedOrderType: string = '149'; // Default value for order type dropdown
  totalOrders: number = 0;

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
orderType149Count : number =0;
orderType299Count : number =0;
  totalLeadsAllocated: number = 0; // Total allocated leads
  totalLeadsCompleted: number = 0; // Total completed leads

   card149Leads : number=0;
  card299Leads : number=0;
   card149Profit : number=0;
   card299Profit : number=0;
// Add the global date range variables

selectedStartDate: Date = new Date(); // Default start date
selectedEndDate: Date = new Date(); // Default end dateselectedEndDate: Date | null = null;

 /**
   * Apply date filter based on the selected range
   */
 constructor(private http: HttpClient) {}

 ngOnInit(): void {
   // Set default dates
   if (!this.selectedStartDate || !this.selectedEndDate) {
     const today = new Date();
     this.selectedStartDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
     this.selectedEndDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)); // End of today
   }
 
   this.fetchData(); // Fetch teams
 }
 
 /**
  * Fetch teams from the backend
  */
 fetchData(): void {
   const headers = new HttpHeaders({
     Authorization: `Bearer ${localStorage.getItem('token')}`,
   });
 
   this.http.get<any[]>('http://localhost:5000/api/teams', { headers }).subscribe({
     next: (teams) => {
       const formattedData = teams.map((team) => ({
         teamId: team.teamId,
         teams: team.teamName,
         allocated: '0/0', // Placeholder until fetched from API
         status: 'Pending', // Default placeholder
       }));
 
       this.dataSource.data = formattedData;
       console.log('Teams Data:', formattedData);
 
       // After teams are loaded, apply date filter and fetch orders
       this.applyDateFilter();
     },
     error: (error) => {
       console.error('Error fetching teams:', error);
     },
   });
 }
 
 /**
  * Apply date filter based on the selected range
  */
 applyDateFilter(): void {
  let startDate: Date;
  let endDate: Date;

  if (this.selectedDateRange === 'today') {
    const today = new Date();
    startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  } else if (this.selectedDateRange === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()));
    endDate = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999));
  } else if (this.selectedDateRange === 'thisWeek') {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startDate = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate()));
    endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  } else if (this.selectedDateRange === 'thisMonth') {
    const today = new Date();
    startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  } else if (this.selectedDateRange === 'custom') {
    if (!this.customStartDate || !this.customEndDate) {
      console.warn('Incomplete custom date range!');
      return;
    }
    startDate = new Date(this.customStartDate);
    endDate = new Date(this.customEndDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Fallback to today's date
    const today = new Date();
    startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  }

  this.selectedStartDate = startDate;
  this.selectedEndDate = endDate;

  this.fetchOrdersData(startDate, endDate);
}




 onOrderTypeChange(): void {
  console.log('Order Type Changed:', this.selectedOrderType);

  // Ensure the previously selected date range is preserved
  const startDate = this.selectedStartDate;
  const endDate = this.selectedEndDate;

  if (!startDate || !endDate) {
    console.error('Invalid date range!');
    return;
  }

  // Re-fetch data with the updated order type and preserved date range
  this.fetchOrdersData(startDate, endDate);
}


 
 /**
  * Fetch orders data based on the selected date range
  */
 fetchOrdersData(startDate: Date | null, endDate: Date | null): void {
  if (!startDate || !endDate) return;

  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const teamIds = this.dataSource.data.map((team) => team.teamId);

  const params = {
    date: startDate.toISOString(),
    endDate: endDate.toISOString(),
    orderType: this.selectedOrderType,
    teamIds: JSON.stringify(teamIds),
  };

  console.log("Request Parameters:", params);

  this.http
    .get<any>('http://localhost:5000/api/fetch-orders', { headers, params })
    .subscribe({
      next: (data) => {
        console.log("Response from Backend:", data);
        if (data.success) {
          this.totalOrders = data.totalOrders || 0;
          this.totalLeadsAllocated = data.totalAllocatedCount || 0;
          this.totalLeadsCompleted = data.totalCompletedCount || 0;
          this.orderType149Count = data.orderType149Count || 0; // Add 149 count
          this.orderType299Count = data.orderType299Count || 0; // Add 299 count

          const teamCounts: TeamCount[] = data.teamCounts;

          const updatedTeams = this.dataSource.data.map((team) => {
            const teamData = teamCounts.find(
              (item: TeamCount) => item.teamId === team.teamId
            );
            if (teamData) {
              const allocated = teamData.allocatedCount;
              const completed = teamData.completionCount;
              team.allocated = `${completed}/${allocated}`;
              team.status = allocated > 0 ? 'Allocated' : 'Pending';
            }
            return team;
          });

          this.dataSource.data = updatedTeams;
        }
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
      },
    });
}



updateAllocatedCounts(allocatedCount: number, completionCount: number): void {
  this.dataSource.data = this.dataSource.data.map((team) => ({
    ...team,
    allocated: `${completionCount}/${allocatedCount}`,
  }));
}


  allocateOrders(): void {
    const token = localStorage.getItem('token'); // Get JWT token
    if (!token) {
      console.error('No token found in local storage.');
      alert('Authentication token is missing. Please log in again.');
      return;
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    // Get current date in YYYY-MM-DD format (default for new orders)
    const currentDate = new Date().toISOString().split('T')[0];
  
    // Prepare allocation data for Admin
    const allocationRequests = {
      orders: this.dataSource.data.map((row) => ({
        date: currentDate, // Default date
        teamId: row.teamId,
        orderType: this.selectedOrderType,
        ordersCount: row.orders || 0, // Ensure valid order count
      })),
    };
  
    console.log('Sending Allocation Request:', JSON.stringify(allocationRequests, null, 2));
  
    // Send POST request
    this.http
      .post('http://localhost:5000/api/allocate-orders', allocationRequests, { headers })
      .subscribe({
        next: (response) => {
          console.log('Orders allocated successfully:', response);
          alert('Orders have been allocated successfully!');
          this.fetchData(); // Refresh data after allocation
        },
        error: (error) => {
          console.error('Error allocating orders:', error);
          alert('Failed to allocate orders. Please try again.');
        },
      });
  }
  
  unallocateOrders(): void {
    const token = localStorage.getItem('token'); // Get JWT token
    if (!token) {
      console.error('No token found in local storage.');
      alert('Authentication token is missing. Please log in again.');
      return;
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
  
    // Ensure selectedTeamId is set
    // if (!this.selectedTeamId) {
    //   console.error('No team selected for unallocation.');
    //   alert('Please select a team before unallocating orders.');
    //   return;
    // }
  
    // Prepare unallocation data for Admin with teamId included
    const unallocationRequests = {
      orders: this.dataSource.data.map((row) => ({
        date: currentDate, // Default date
        teamId: row.teamId,
        orderType: this.selectedOrderType,
        ordersCount: row.orders || 0, // Ensure valid order count
      })),
    };
  
    console.log('Sending Unallocation Request:', JSON.stringify(unallocationRequests, null, 2));
  
    // Send POST request
    this.http
      .post('http://localhost:5000/api/unallocate-orders', unallocationRequests, { headers })
      .subscribe({
        next: (response) => {
          console.log('Orders unallocated successfully:', response);
          alert('Orders have been unallocated successfully!');
          this.fetchData(); // Refresh data after unallocation
        },
        error: (error) => {
          console.error('Error unallocating orders:', error);
          alert('Failed to unallocate orders. Please try again.');
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
  this.http.post('  http://localhost:5000/api/orders ' 
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
