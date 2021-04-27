import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybookCategoriesComponent } from './playbook-categories.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule } from '../../../shared/modules/core/core.module';

describe('PlaybookCategoriesComponent', () => {
  let component: PlaybookCategoriesComponent;
  let fixture: ComponentFixture<PlaybookCategoriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaybookCategoriesComponent],
      imports: [ CoreModule, RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybookCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
