import { State, Action, StateContext } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile, UserLogin } from './user.action';
import { StorageService } from '@libs/v5-storage/storage.service';
import { AppService } from '@src/app/app.service';
import { tap } from 'rxjs/operators';

@State<ApiUserInformation>({
  name: 'user',         // 'user' state 라는 것을 표시
  defaults: {} as any   // user 정보를 담는 공간
})
export class UserState {

  constructor(
    private a: AppService,
    private storageService: StorageService
  ) {
  }

  /**
   * 초기화를 한다.
   * 여기서 StateContext 를 가지고 원하는 작업을 할 수 있다.
   * `defaults` 메타 데이터에 초기값을 변경하는 등의 작업을 할 수 있다.
   * @param ctx context
   *
   * @note 참고로 여기서 localStorage 에 저장된 회원 정보를 `defaults` 로 초기화 한다.
   *      즉, 이전 회원로그인 정보를 가져와서 로그인 정보를 세팅하는 것이다.
   */
  ngxsOnInit(ctx: StateContext<ApiUserInformation>) {
    ctx.setState(this.a.user());
  }

  /**
   * Saves user profile information into the state
   * @note 회원 정보를 업데이트 해야 할 경우가 생기면 무조건 이 Action 을 dispatch 하면 된다.
   * @param ctx ctx
   * @param user user
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, action: UserProfile) {
    /**
     * 참고: 전달된 값은 action 객체 전체이다.
     * 이 action 객체 안에, action.user, action.idx 등의 값이 존재한다.
     */
    this.storageService.set('user', action);
    // 참고: patchState 를 하니까, 값이 마지막으로 적용하는 값이 제대로 적용이 되지 않는다.
    // 참고: 그래서 setState() 를 통해서 저장한다.
    // 참고: 면밀한 분석이 필요하다.
    ctx.setState(action as any);
  }

  /**
   * User login
   * @note 사용자 로그인 Action 이 dispatch 되면 필고 백엔드로 로그인을 하고 성공/실패 여부를 알린다.
   */
  @Action(UserLogin)
  login(ctx: StateContext<ApiUserInformation>, action: UserLogin) {
    return this.a.philgo.login({ uid: action.login.uid, password: action.login.password })
      .pipe(
        tap( user => {
          // 아래와 같이 ctx 로 다시 Action 을 dispatch 할 수 있다.
          // 아래의 Action 을 통해서 회원 정보를 localStorage 에 저장한다.
          ctx.dispatch(new UserProfile(user));
        })
      );
  }


}





