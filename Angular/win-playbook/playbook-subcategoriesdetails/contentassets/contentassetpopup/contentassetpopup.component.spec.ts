import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentassetpopupComponent } from './contentassetpopup.component';
import { CoreModule } from '../../../../../shared/modules/core/core.module';

describe('ContentassetpopupComponent', () => {
  let component: ContentassetpopupComponent;
  let fixture: ComponentFixture<ContentassetpopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentassetpopupComponent ],
      imports: [ CoreModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentassetpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
