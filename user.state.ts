import { State, Action, StateContext, NgxsOnInit } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile, UserLogin, UserLogout, UserRegister, UserProfileUpdate } from './user.action';
import { tap } from 'rxjs/operators';
import { AppService } from '@libs/app.service';



@State<ApiUserInformation>({
  name: 'user',         // 'user' state.
  defaults: {} as any   // Set user object. Not atction.
})
export class UserState implements NgxsOnInit {

  constructor(
    private a: AppService
  ) {
    // console.log('this: ', this);
  }

  ngxsOnInit(ctx: StateContext<ApiUserInformation>) {
    const localUser = this.a.get('user');
    this.profile(ctx, { user: localUser } as any);
  }

  /**
   * Saves user profile information into the state
   * @note This method will be called whenever profile updates.
   * @param ctx ctx
   * @param { user } `UserProfile` class which holds the `user` payload.
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, { user }: UserProfile) {
    // if no user, maybe the app is booting
    this.a.set('user', user);
    ctx.patchState(user);
  }

  /**
   * Login to philgo backend then set user info to State and localStorage if success.
   *
   * @param ctx State Context
   * @param { user } `UserLogin` Class containing the `user` payload.
   */
  @Action(UserLogin) login(ctx: StateContext<ApiUserInformation>, { user }: UserLogin) {

    return this.a.philgo.login(user).pipe(
      tap(res => {
        console.log(res);
        this.profile(ctx, { user: res } as any);
      })
    );

  }

  /**
   * Register to philgo backend then set user info to State and localStorage if success.
   *
   * @param ctx State Context
   * @param { user } `UserRegister` Class containing the `user` payload.
   */
  @Action(UserRegister)
  register(ctx: StateContext<ApiUserInformation>, { user }: UserRegister) {

    return this.a.philgo.register(user)
      .pipe(
        tap(res => {
          this.profile(ctx, { user: res } as any);
        })
      );
  }

  /**
   * Update user profile information to backend then save to state and localstorage if success.
   *
   * @param ctx StateContext
   * @param { user } `UserProfileUpdate` Class containing the `user` payload.
   */
  @Action(UserProfileUpdate) profileUpdate(ctx: StateContext<ApiUserInformation>, { user }: UserProfileUpdate) {
    const localUser = this.a.helper.get('user');

    user['idx_member'] = localUser.idx;         // do this since `philgo.addLogin()` is not fixed yet.
    user.session_id = localUser.session_id;     // do this since `philgo.addLogin()` is not fixed yet.

    return this.a.philgo.profileUpdate(user)
      .pipe(
        tap(res => {
          console.log(res);
          this.profile(ctx, { user: res } as any);
        })
      );
  }

  /**
   * Resets the state and Set null value for user on localStorage.
   *
   * @param ctx state context
   */
  @Action(UserLogout) logout(ctx: StateContext<ApiUserInformation>) {
    this.a.set('user', {});
    ctx.setState({ } as any);
  }

}





