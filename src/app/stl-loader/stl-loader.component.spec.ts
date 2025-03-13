import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StlLoaderComponent } from './stl-loader.component';

describe('StlLoaderComponent', () => {
  let component: StlLoaderComponent;
  let fixture: ComponentFixture<StlLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StlLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StlLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
