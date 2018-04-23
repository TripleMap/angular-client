import { Component, AfterContentInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { AuthService } from '../auth-service';
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { Subscription } from "rxjs/Subscription";
@Component({
  selector: 'registration',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  host: {
    class: 'dark-theme'
  }
})
export class Register implements AfterContentInit, OnDestroy {
  public registerForm: FormGroup;
  public registerEnable: any;
  public mediaSubscription: Subscription;
  public registerFormSubscription: Subscription;
  public passVisible: boolean = false;
  public confirmVisible: boolean = false;
  constructor(
    public router: Router,
    public fb: FormBuilder,
    public AuthService: AuthService,
    public media: ObservableMedia
  ) {
    this.mediaSubscription = media.subscribe((change: MediaChange) => (console.log(change)));
  }
  ngAfterContentInit() {
    this.registerForm = this.fb.group({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.pattern("^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$")]),
      password: new FormControl('', [Validators.required]),
      passwordConfirm: new FormControl('', [Validators.required])
    }, { validator: this.confirmPassfordValidation('password', 'passwordConfirm') });

    this.registerFormSubscription = this.registerForm.valueChanges
      .debounceTime(200)
      .distinctUntilChanged()
      .filter(this.isValidForm)
      .subscribe()
  }

  ngOnDestroy() {
    this.mediaSubscription.unsubscribe();
    this.registerFormSubscription.unsubscribe();
  }

  isValidForm = () => {
    (this.registerForm.status !== "VALID") ? this.registerEnable = false : this.registerEnable = true;
    console.log(this.registerForm);
    return this.registerForm.status === "VALID";
  };

  registration() {
    if (!this.registerEnable) return;
    const creditals = {
      username: this.registerForm.get('name').value,
      email: this.registerForm.get('email').value,
      password: this.registerForm.get('password').value,
    }
    this.AuthService.registration(creditals);
  }

  login() {
    this.router.navigate(['login']);
  }

  confirmPassfordValidation(passwordKey: string, passwordConfirmationKey: string) {
    return (group: FormGroup) => {
      let passwordInput = group.controls[passwordKey],
        passwordConfirmationInput = group.controls[passwordConfirmationKey];
      if (passwordInput.value !== passwordConfirmationInput.value) {
        return passwordConfirmationInput.setErrors({ notEquivalent: true })
      }
      else {
        return passwordConfirmationInput.setErrors(null);
      }
    }
  }
}

