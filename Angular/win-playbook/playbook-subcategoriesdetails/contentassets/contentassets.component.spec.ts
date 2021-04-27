import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentassetsComponent } from './contentassets.component';
import { CoreModule } from '../../../../shared/modules/core/core.module';

import { ContentassetpopupComponent } from '../contentassets/contentassetpopup/contentassetpopup.component';

describe('ContentassetsComponent', () => {
  let component: ContentassetsComponent;
  let fixture: ComponentFixture<ContentassetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentassetsComponent, ContentassetpopupComponent ],
      imports: [ CoreModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentassetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
