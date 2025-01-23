import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule,MatTableDataSource } from '@angular/material/table';
import { HttpClient ,HttpHeaders} from '@angular/common/http';


// Update the Member interface
interface Member {
  srNo?: number;
  name: string;
  orders: number;
  status: string;
  teamId: string;
  // Add this line
  memberId?: string; 
}

@Component({
  selector: 'app-teamleader',
  standalone: true,
  imports: [MatDatepickerModule,FormsModule,CommonModule,
    MatSelectModule,
  MatTableModule,
MatInputModule,
MatSortModule],
  templateUrl: './teamleader.component.html',
  styleUrl: './teamleader.component.scss'
})
export class TeamleaderComponent implements OnInit{

  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();
  selectedDateRange: string = 'today';
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;
  selectedOrderType: string = '149';

  displayedColumns: string[] = ['srNo', 'memberName', 'orders', 'allocated'];
  dataSource = new MatTableDataSource<Member>([]);

  allocatedCount: number = 0;
  completedCount: number = 0;

  constructor(private http: HttpClient) {}
  ngOnInit(): void {
    // Set default date range to today
    const today = new Date();
    this.selectedStartDate = today;
    this.selectedEndDate = today;
    
    // Fetch members and then fetch orders data with default dates
    this.fetchMembers();
  }
  
 
applyDateFilter(): void {
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
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
  }
  
  // Ensure startDate and endDate are never null
  if (this.dataSource.data.length > 0) {
    const teamId = this.dataSource.data[0].teamId;
    this.fetchOrdersData(startDate || new Date(), endDate || new Date(), teamId);
  }
}
// Modify fetchMembers to include memberId
fetchMembers(): void {
  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  this.http.get<any[]>('http://localhost:5000/api/teams', { headers }).subscribe({
    next: (teams) => {
      const membersData = teams.flatMap((team: any) =>
        team.membersList.map((member: { name: string, memberId: string }, index: number) => ({
          srNo: index + 1,
          name: member.name,
          orders: 0, // Placeholder for order input
          allocated: '0/0', // Placeholder until fetched from API
          status: 'Pending', // Default status
          teamId: team.teamId, // Add teamId here
          memberId: member.memberId // Add memberId here
        }))
      );

      this.dataSource.data = membersData;
      console.log('Members Data:', membersData);

      // After members are fetched, call fetchOrdersData with default dates
      const teamId = membersData[0]?.teamId; // Get teamId from members data
      if (teamId) {
        this.fetchOrdersData(this.selectedStartDate, this.selectedEndDate, teamId);
      }
    },
    error: (error) => {
      console.error('Error fetching members:', error);
    },
  });
}

fetchOrdersData(startDate: Date, endDate: Date, teamId: string): void {
  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const params = {
    date: startDate.toISOString(),
    endDate: endDate.toISOString(),
    orderType: this.selectedOrderType,
    teamId,
  };

  this.http
    .get<{
      success: boolean;
      teamAllocatedCount: number;
      teamCompletionCount: number;
      memberCounts?: Array<{
        _id: string,
        memberName: string,
        assignedCount: number,
        completedCount: number
      }>
    }>('http://localhost:5000/api/fetch-orders', { headers, params })
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.allocatedCount = response.teamAllocatedCount || 0;
          this.completedCount = response.teamCompletionCount || 0;

          // Update each member's allocated field with their specific counts
          this.dataSource.data = this.dataSource.data.map((member) => {
            // Add null check for memberCounts
            const memberCount = response.memberCounts 
              ? response.memberCounts.find(m => m.memberName === member.name)
              : null;

            return {
              ...member,
              allocated: memberCount 
                ? `${memberCount.completedCount}/${memberCount.assignedCount}` 
                : '0/0',
            };
          });
        }
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
      },
    });
}



allocateOrders(): void {
  // Collect orders to allocate, filtering out rows with zero orders
  const ordersToAllocate = this.dataSource.data
    .filter(member => member.orders > 0)
    .map(member => ({
      date: this.selectedStartDate.toISOString(),
      teamId: member.teamId,
      memberId: member.memberId,
      memberName: member.name,  // Ensure memberName is included
      orderType: this.selectedOrderType,
      ordersCount: member.orders
    }));

  if (ordersToAllocate.length === 0) {
    alert('No orders to allocate');
    return;
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  this.http.post('http://localhost:5000/api/allocate-orders', 
    { orders: ordersToAllocate }, 
    { headers }
  ).subscribe({
    next: (response: any) => {
      console.log('Orders allocated successfully', response);
      
      // Reset orders column and refresh data
      this.dataSource.data = this.dataSource.data.map(member => ({
        ...member,
        orders: 0
      }));
      
      // Refresh orders data
      if (this.dataSource.data.length > 0) {
        const teamId = this.dataSource.data[0].teamId;
        this.fetchOrdersData(this.selectedStartDate, this.selectedEndDate, teamId);
      }
    },
    error: (error) => {
      console.error('Error allocating orders:', error);
    }
  });
}

unallocateOrders(): void {
  // Step 1: Collect orders to unallocate. Assuming a similar structure to allocation.
  // NOTE: You'll want to have a way to specify which orders are to be unallocated
  const ordersToUnallocate = this.dataSource.data
    .filter(member => member.orders > 0) // Adjust this according to your logic
    .map(member => ({
      date: this.selectedStartDate.toISOString(),
      teamId: member.teamId,
      orderType: this.selectedOrderType,
      ordersCount: member.orders, // Assuming you are using this to limit the number of orders to unallocate
    }));

  if (ordersToUnallocate.length === 0) {
    alert('No orders to unallocate');
    return;
  }

  // Step 2: Create headers for API call
  const headers = new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // Step 3: Make HTTP POST request
  this.http.post('http://localhost:5000/api/unallocate-orders',
    { orders: ordersToUnallocate },
    { headers }
  ).subscribe({
    next: (response: any) => {
      console.log('Orders unallocated successfully', response);
      
      // Reset orders column (optional based on your UI/UX)
      this.dataSource.data = this.dataSource.data.map(member => ({
        ...member,
        orders: 0 // Reset orders left after unallocation
      }));

      // Optionally refresh orders data after unallocation
      if (this.dataSource.data.length > 0) {
        const teamId = this.dataSource.data[0].teamId;
        this.fetchOrdersData(this.selectedStartDate, this.selectedEndDate, teamId);
      }
    },
    error: (error) => {
      console.error('Error unallocating orders:', error);
    }
  });
}

}
