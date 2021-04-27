import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlaybookCategoriesComponent } from './playbook-categories/playbook-categories.component';
import { PlaybookSubcategoriesComponent } from './playbook-subcategories/playbook-subcategories.component';
import { PlaybookSubcategoriesdetailsComponent } from './playbook-subcategoriesdetails/playbook-subcategoriesdetails.component';

const routes: Routes = [
  {
    path: '',
    component: PlaybookCategoriesComponent,
    children: [
      {
        path: ':id',
        component: PlaybookSubcategoriesComponent,
        children:[
          { 
           path: ':sub-id',
           component: PlaybookSubcategoriesdetailsComponent,
          }
        ]
      },
    ]  
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WinNavigationRoutingModule { }