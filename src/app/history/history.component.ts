import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit ,ViewChild,AfterViewInit} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders ,HttpParams} from '@angular/common/http';
import moment from 'moment';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
// import * as FileSaver from 'file-saver';

import { MatOption, MatSelect } from '@angular/material/select';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    FormsModule,
    CommonModule,
    MatSelect,
    MatOption,
    MatPaginator,
    MatDialogModule,
    // HttpClientModule, // HttpClientModule only needed in app.module.ts, can be removed here
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent implements OnInit {
  selectedDate: Date = new Date(); // Default to the current date
  role: string = ''; // Stores user role

  selectedPaidStatus: string | null = null;
  selectedTeamName: string | null = null;
  teamNames: any[] = [];// Optional member filter
  selectedVerifyStatus: string | null=null;

  totalOrders = 0;
  paidOrders = 0;
  unpaidOrders = 0;
  totalAllocatedOrders=0;
  displayedColumns: string[] = [
    'srNo',
    'orderId',
    'coupon',
    'orderType',
    'orderLink',
    'verification',
    'allocatedTeamName',
    'allocatedMember',
    'mergedColumn',
    
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  data: any[] = [];
  dataSource = new MatTableDataSource<any>();
  loading: boolean = false;
  private readonly apiUrl = ' http://localhost:5000/api/result';
  private teamsApiUrl = 'http://localhost:5000/api/teams'

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,private dialog: MatDialog ) {}
  @ViewChild('orderDetailsDialog') orderDetailsDialog: any;

  ngOnInit(): void {
    this.fetchTeams();
    this.role = localStorage.getItem('role') || '';

    // this.loadAllResults(); // Load all results initially
  }
  fetchTeams(): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token from localStorage
    });

    this.http.get<any[]>(this.teamsApiUrl, { headers }).subscribe({
      next: (response) => {
        this.teamNames = response.map(team => ({
          id: team._id,
          name: team.teamName
        }));
      },
      error: (error) => {
        console.error('Error fetching teams:', error);
      }
    });
  }
  onFilterChange(): void {
    this.getOrdersCount();
    this.loadAllResults();
    
     // Re-fetch results based on current filter values
  }

  

getOrdersCount(): void {
  // this.loading = true;
  
  // const formattedDate = this.selectedDate
  //   ? moment(this.selectedDate).format('YYYY-MM-DD')
  //   : new Date().toISOString().split('T')[0];

  // let params = new HttpParams().set('date', formattedDate);
  // if (this.selectedTeamName) {
  //   params = params.set('teamName', this.selectedTeamName);
  // }

  // const headers = new HttpHeaders({
  //   Authorization: `Bearer ${localStorage.getItem('token')}`,
  // });

  // this.http
  //   .get<{ totalOrders: number; totalAllocatedLeads: number }>(
  //     'http://localhost:5000/api/orders/count',
  //     { params, headers }
  //   )
  //   .pipe(
  //     finalize(() => {
  //       this.loadAllResults(); // Guaranteed to run after request completes
  //     })
  //   )
  //   .subscribe({
  //     next: (response) => {
  //       this.totalOrders = response.totalOrders;
  //       this.totalAllocatedOrders = response.totalAllocatedLeads;
  //     },
  //     error: (error) => {
  //       console.error('Error fetching order count:', error);
  //     }
  //   });
}
loadAllResults(): void {
  this.loading = true;

  const formattedDate = this.selectedDate
    ? moment(this.selectedDate).format('YYYY-MM-DD')
    : null;

  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token from localStorage
  });

  const queryParams: any = {};
  if (formattedDate) queryParams.date = formattedDate;
  if (this.selectedPaidStatus) queryParams.paidStatus = this.selectedPaidStatus;
  if (this.selectedTeamName) queryParams.teamName = this.selectedTeamName;

  const queryString = new URLSearchParams(queryParams).toString();
  console.log("Query String:", queryString);

  this.http
    .get<any>(`${this.apiUrl}?${queryString}`, { headers }) // Ensure response is treated as any
    .subscribe({
      next: (response: any) => {
        console.log("Response from API:", response);

        // Check if the response has the correct properties
        this.data = response.orders.map((item: any) => this.formatResult(item));
        this.dataSource.data = this.data;
        this.dataSource.paginator = this.paginator;

        // Make sure we are accessing correct properties of the response
        this.paidOrders = response.paidOrders;
        this.unpaidOrders = response.unpaidOrders;
        this.totalOrders = response.totalOrders;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("Error fetching results:", error);
        this.loading = false;
      },
    });
}



  openOrderDetails(data: any): void {
    this.dialog.open(this.orderDetailsDialog, {
      width: '400px',
      data,
    });
  }

  /**
   * Format API result into table-compatible data
   */
  private formatResult(item: any): any {
    return {
      orderId: item.orderId || 'N/A',
      coupon: item.coupon || 'N/A',
      orderLink: item.orderLink || 'N/A',
      orderType: item.orderType || 0,

      allocatedTeamName: item.allocatedTeamName || 'N/A',
      allocatedMember: item.allocatedMember || 'Not Allocated',
      verification: item.verification || 'N/A',

      // Map payment status
      paymentStatus: item.paymentStatus || 'N/A',

      // Profit values
      profit: item.profit || 0,
      memberProfit: item.memberProfit || 0,
    };
}

  /**
   * Download data as CSV
   */
  downloadData(): void {
    this.loading = true; // Start the loader before processing the data

    const formattedDate = moment(this.selectedDate).format('YYYY-MM-DD');
    const headers = ['Order ID','Coupon','Order Link', 'Order Type', 'Team Name', 'Member Name', 'Payment Status', 'Profit', 'Member Profit','Verification',];
    const csvData = this.dataSource.data.map((row) => ({
      'Order ID': row.orderId,
      'Coupon' : row.coupon,
      'Order Link': row.orderLink,
      'Order Type': row.orderType, // Add orderType to CSV data

      'Team Name': row.allocatedTeamName,
      'Verification': row.verification || 'N/A', // Map completion field

      'Member Name': row.allocatedMember,

      'Payment Status': row.paymentStatus,
      'Profit': `₹${row.profit}`, // Include icon representation in text
      'Member Profit': `₹${row.memberProfit}`, // Include icon representation in text
    }));
  
    const csvContent = [
      headers.map((header) => `"${header}"`).join(','), // Wrap headers in quotes
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`) // Wrap each field value in quotes
          .join(',')
      ),
    ].join('\n');
  
    // Add UTF-8 BOM for proper encoding
    const utf8Bom = '\uFEFF';
    const blob = new Blob([utf8Bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `orders_${formattedDate}.csv`;
  
    // setTimeout(() => {
    //   FileSaver.saveAs(blob, fileName);
    //   this.loading = false; // Stop the loader after download starts
    //   this.cdr.detectChanges(); // Ensure UI updates
    // }, 100); // Simulated delay for async operation  }
  
  }
  /**
   * Search by date
   */
  searchByDate(): void {
    this.getOrdersCount();
    this.loadAllResults();
     
  }
  
}
