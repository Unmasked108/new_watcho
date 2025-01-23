import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboradComponent } from './dashborad/dashborad.component';
import { TeamsComponent } from './teams/teams.component';
import { HistoryComponent } from './history/history.component';
import { LoginComponent } from './login/login.component';
import { TeamleaderComponent } from './teamleader/teamleader.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },  // Login page
    { path: '', redirectTo: 'login', pathMatch: 'full' },  // Default to login

    {path: 'layout' , component: LayoutComponent,
        children: [
            {path:'' , redirectTo:'dashboard' ,pathMatch:'full'},
            {path:'dashboard' ,component:DashboradComponent},
            {path: 'teams', component: TeamsComponent},
            {path: 'history', component: HistoryComponent},
            {path: 'team' ,component:TeamleaderComponent}
        ]
    }];
