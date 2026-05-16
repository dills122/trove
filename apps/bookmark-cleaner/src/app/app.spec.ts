import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the hero with the current title value', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const heroHeading: HTMLHeadingElement | null = fixture.nativeElement.querySelector('h1');
    expect(heroHeading?.textContent).toContain('angular-mat-tailwind-starter');
  });

  it('scrolls to the live example section when CTA is clicked', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const jumpButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('button');
    expect(jumpButton).toBeTruthy();

    jumpButton?.click();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    scrollToSpy.mockRestore();
  });
});
