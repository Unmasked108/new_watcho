import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboradComponent } from './dashborad/dashborad.component';
import { TeamsComponent } from './teams/teams.component';
import { HistoryComponent } from './history/history.component';

export const routes: Routes = [
    {path: 'layout' , component: LayoutComponent,
        children: [
            {path:'' , redirectTo:'dashboard' ,pathMatch:'full'},
            {path:'dashboard' ,component:DashboradComponent},
            {path: 'teams', component: TeamsComponent},
            {path: 'history', component: HistoryComponent}
        ]
    }];
