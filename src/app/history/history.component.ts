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
  role: string | null = null; 
  selectedPaidStatus: string | null = null;
  selectedTeamName: string | null = null;
  teamNames: any[] = [];
  teamName: any;
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
  private readonly apiUrl = ' http://localhost:5000/api/orders';
  private teamsApiUrl = 'http://localhost:5000/api/teams'
  teamId: any;
  userId: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,private dialog: MatDialog ) {}
  @ViewChild('orderDetailsDialog') orderDetailsDialog: any;

  ngOnInit(): void {
    this.fetchTeams();
    this.role = localStorage.getItem('role'); 
    this.userId = localStorage.getItem('userId');

    // this.loadAllResults(); // Load all results initially
  }
  fetchTeams(): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token from localStorage
    });

    this.http.get<any[]>(this.teamsApiUrl, { headers }).subscribe({
      next: (response) => {
        if (this.role === 'TeamLeader') {
          // Ensure teamLeader._id is a string before comparison
          const teamLeaderTeam = response.find(team => team.teamLeader?._id?.toString() === this.userId);
          if (teamLeaderTeam) {
            this.teamId = teamLeaderTeam.teamId; 
            this.teamName =teamLeaderTeam.teamName// Assign teamId for TeamLeader
           
            
          } else {
            console.warn('No team found for this TeamLeader.');
          }
        } else {
          // For Admin or other roles
          this.teamNames = response.map(team => ({
            id: team._id,
            teamId: team.teamId,
            name: team.teamName,
          }));
        }
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
  this.loading = true;
  
  const formattedDate = this.selectedDate
    ? moment(this.selectedDate).format('YYYY-MM-DD')
    : new Date().toISOString().split('T')[0];

  let params = new HttpParams().set('date', formattedDate);
  if (this.selectedTeamName) {
    params = params.set('teamName', this.selectedTeamName);
  }
  if (this.role === 'TeamLeader' ) {
    params = params.set('teamName', this.teamName);
  }


  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  this.http
    .get<{ totalOrders: number; totalAllocatedLeads: number }>(
      'http://localhost:5000/api/orders/count',
      { params, headers }
    )
    .pipe(
      finalize(() => {
        this.loadAllResults(); // Guaranteed to run after request completes
      })
    )
    .subscribe({
      next: (response) => {
        this.totalOrders = response.totalOrders;
        this.totalAllocatedOrders = response.totalAllocatedLeads;
      },
      error: (error) => {
        console.error('Error fetching order count:', error);
      }
    });
}

  loadAllResults(): void {
    this.loading = true;

    const formattedDate = this.selectedDate
      ? moment(this.selectedDate).format('YYYY-MM-DD')
      : null;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token from localStorage
    });

    // Build query params dynamically
    const queryParams: any = {};
    if (formattedDate) queryParams.date = formattedDate;
    if (this.selectedPaidStatus) queryParams.paidStatus = this.selectedPaidStatus;
    if (this.selectedTeamName) queryParams.teamName = this.selectedTeamName;
    if (this.selectedVerifyStatus) queryParams.verifyStatus = this.selectedVerifyStatus; // Add Verify Orders filter
    if (this.role === 'TeamLeader') {
      queryParams.teamId = this.teamId;
    }
    const queryString = new URLSearchParams(queryParams).toString();
    console.log(queryString)

    this.http.get<any[]>(`${this.apiUrl}?${queryString}`, { headers }).subscribe({
      next: (response) => {
        console.log('Response from API:', response);
         this.data = response.map((item) => this.formatResult(item));
         this.dataSource.data = this.data;
         this.dataSource.paginator = this.paginator;

         this.paidOrders = this.data.filter((item) => item.paymentStatus === 'Paid').length;
         this.unpaidOrders = this.data.filter((item) => item.paymentStatus === 'Unpaid').length;
         console.log('UNPaid Orders:', this.unpaidOrders);
         this.loading = false; // Stop spinner after data is loaded
         this.cdr.detectChanges();
        // Handle the response data
        this.loading = false; // Stop spinner after data is loaded
      },
      error: (error) => {
        console.error('Error fetching results:', error);
        this.loading = false; // Stop spinner even on error
      }
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
      coupon:item.coupon || 'N/A',
      orderLink:item.link || 'N/A' , // Correct mapping
      orderType: item.orderType || 0, // Include orderType

      allocatedTeamName: item.teamName || 'N/A', // Access nested `teamName`
      verification: item.completionStatus || 'N/A',
      allocatedMember: item.memberName || 'N/A',
      paymentStatus: 
      item.status === 'Completed' 
        ? 'Paid' 
        : (item.status === 'Allocated' || item.status === 'Assign') 
          ? 'Unpaid' 
          : 'N/A',
      profit: item.profitBehindOrder || 0,
      memberProfit: item.membersProfit || 0,
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
