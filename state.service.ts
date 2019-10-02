import { Injectable } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { UserLogin, UserLogout, UserRegister, UserProfile, UserProfileUpdate } from './user.action';
import { ApiLoginRequest, ApiRegisterRequest, ApiProfileUpdateRequest } from '@libs/philgo-api/philgo-api-interface';
import { withLatestFrom } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppService } from '@src/app/app.service';

@Injectable({ providedIn: 'root' })
export class StateService {

  @Select(s => s.user ) user$: Observable<any>;

  constructor(private store: Store, private a: AppService) { }

  checkUser() {
    const user = this.a.user();
    this.store.dispatch(new UserProfile(user)).subscribe((_) => {
      // console.log(_);
    });
  }

  register(user: ApiRegisterRequest) {
    return this.store.dispatch(new UserRegister(user)).pipe( withLatestFrom( this.user$ ));
  }

  login(user: ApiLoginRequest) {
    return this.store.dispatch(new UserLogin(user));
  }

  updateProfile(user: ApiProfileUpdateRequest) {
    return this.store.dispatch(new UserProfileUpdate(user));
  }

  logout() {
    return this.store.dispatch(new UserLogout());
  }

}
