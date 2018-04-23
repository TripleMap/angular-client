import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TdmapSistem } from '../components/tdmap-sistem/tdmap-sistem.component'
import { Login } from '../auth/login/login';
import { Register } from '../auth/register/register.component';
import { AuthGuard } from '../auth/auth-guard';
import { NotFound } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: TdmapSistem, canActivate: [AuthGuard] },
  { path: 'registration', component: Register },
  { path: 'login', component: Login },
  { path: 'tdmap', component: TdmapSistem, canActivate: [AuthGuard] },
  { path: 'not-found', component: NotFound },
  { path: '**', component: NotFound },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
