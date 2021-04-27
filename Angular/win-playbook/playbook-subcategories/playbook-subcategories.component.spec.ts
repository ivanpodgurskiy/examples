import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybookSubcategoriesComponent } from './playbook-subcategories.component';
import { CoreModule } from '../../../shared/modules/core/core.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('PlaybookSubcategoriesComponent', () => {
  let component: PlaybookSubcategoriesComponent;
  let fixture: ComponentFixture<PlaybookSubcategoriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaybookSubcategoriesComponent ],
      imports: [ CoreModule, RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybookSubcategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
