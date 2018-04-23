import { Component, AfterContentInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { AuthService } from '../auth-service';

import { Subscription } from "rxjs/Subscription";
@Component({
  selector: 'login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  host: {
    class: 'dark-theme'
  }
})
export class Login implements AfterContentInit, OnDestroy {
  public loginForm: FormGroup;
  public loginEnable: any;
  public mediaSubscription: Subscription;
  public loginFormSubscription: Subscription;
  public invisible: boolean = false;
  constructor(
    public router: Router,
    public fb: FormBuilder,
    public AuthService: AuthService,
    public media: ObservableMedia
  ) {
    this.mediaSubscription = media.subscribe((change: MediaChange) => (console.log(change)));
  }
  ngAfterContentInit() {
    this.loginForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.pattern("^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$")]),
      password: new FormControl('', [Validators.required])
    });

    this.loginFormSubscription = this.loginForm.valueChanges
      .debounceTime(200)
      .distinctUntilChanged()
      .filter(this.isValidForm)
      .subscribe()
  }

  ngOnDestroy() {
    this.mediaSubscription.unsubscribe();
    this.loginFormSubscription.unsubscribe();
  }

  isValidForm = () => {
    (this.loginForm.status !== "VALID") ? this.loginEnable = false : this.loginEnable = true;
    return this.loginForm.status === "VALID";
  };

  login() {
    if (!this.loginEnable) return;
    const creditals = {
      email: this.loginForm.get('email').value,
      password: this.loginForm.get('password').value,
    }
    this.AuthService.login(creditals);
  }

  registration() {
    this.router.navigate(['registration']);
  }
}
