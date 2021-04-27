import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybookSubcategoriesdetailsComponent } from './playbook-subcategoriesdetails.component';
import { CoreModule } from '../../../shared/modules/core/core.module';
import { RouterTestingModule } from '@angular/router/testing';

import { VideoassetComponent } from './videoasset/videoasset.component';
import { ContentassetsComponent } from './contentassets/contentassets.component';

describe('PlaybookSubcategoriesdetailsComponent', () => {
  let component: PlaybookSubcategoriesdetailsComponent;
  let fixture: ComponentFixture<PlaybookSubcategoriesdetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaybookSubcategoriesdetailsComponent, VideoassetComponent, ContentassetsComponent ],
      imports: [ CoreModule, RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybookSubcategoriesdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
