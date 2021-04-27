import { NgModule } from '@angular/core';

// Components
import { PlaybookCategoriesComponent } from './playbook-categories/playbook-categories.component';
import { PlaybookSubcategoriesComponent } from './playbook-subcategories/playbook-subcategories.component';
import { PlaybookSubcategoriesdetailsComponent } from './playbook-subcategoriesdetails/playbook-subcategoriesdetails.component';
import { WinNavigationRoutingModule } from './win-playbook.routing';

//Other modules
import { ToastrModule } from 'ng6-toastr-notifications'; // Toaster
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';

// Shared Module
import { CoreModule } from '../../shared/modules/core/core.module';
import { VideoassetComponent } from './playbook-subcategoriesdetails/videoasset/videoasset.component';
import { ContentassetsComponent } from './playbook-subcategoriesdetails/contentassets/contentassets.component';
import { ContentassetpopupComponent } from './playbook-subcategoriesdetails/contentassets/contentassetpopup/contentassetpopup.component';

@NgModule({
  declarations: [
    PlaybookCategoriesComponent, 
    PlaybookSubcategoriesComponent, 
    PlaybookSubcategoriesdetailsComponent, 
    VideoassetComponent, 
    ContentassetsComponent, 
    ContentassetpopupComponent
  ],
  imports: [
    WinNavigationRoutingModule,
    MalihuScrollbarModule.forRoot(),
    ToastrModule.forRoot(),
    CoreModule
  ],
  providers: [
    
  ],
  entryComponents: [
    ContentassetpopupComponent
  ]
})
export class WinPlaybookModule { }

