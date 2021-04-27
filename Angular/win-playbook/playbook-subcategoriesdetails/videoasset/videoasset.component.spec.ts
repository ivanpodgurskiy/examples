import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoassetComponent } from './videoasset.component';
import { CoreModule } from '../../../../shared/modules/core/core.module';

describe('VideoassetComponent', () => {
  let component: VideoassetComponent;
  let fixture: ComponentFixture<VideoassetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoassetComponent ],
      imports: [ CoreModule ] 
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoassetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
