import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  username: string = '';
  initials: string = '';
  isDarkMode: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  changePasswordForm: FormGroup;
  isResponseCardVisible = false;
  responseMessage = '';
  isChangePasswordModalOpen = false;
  oldPasswordVisible = false;
  newPasswordVisible = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Form initialization
    this.changePasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6),Validators.maxLength(12),Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,12}$') ]],
    });
  }

  ngOnInit(): void {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
    this.username = localStorage.getItem('username') || '';
    this.initials = this.getInitials(this.username);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }

  openChangePasswordModal() {
    this.isChangePasswordModalOpen = true;
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      const {newPassword } = this.changePasswordForm.value;
      const headers = new HttpHeaders({
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            });
      this.http.put('http://localhost:5000/change-password', {newPassword}, {headers }).subscribe({
        next: (res: any) => {
          this.responseMessage = res.message || 'Password changed successfully.';
          this.isResponseCardVisible = true;
          this.isChangePasswordModalOpen = false;
        },
        error: (err) => {
          this.responseMessage = err.error?.message || 'An error occurred.';
          this.isResponseCardVisible = true;
        },
      });
    }
  }

  togglePasswordVisibility(field: string) {
     if (field === 'newPassword') {
      this.newPasswordVisible = !this.newPasswordVisible;
    }
  }

  closeResponseCard() {
    this.isResponseCardVisible = false;
    this.closeModal.emit();
  }
}
