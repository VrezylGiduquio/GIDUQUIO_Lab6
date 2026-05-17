import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailInbox } from './email-inbox';

describe('EmailInbox', () => {
  let component: EmailInbox;
  let fixture: ComponentFixture<EmailInbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailInbox],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailInbox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
