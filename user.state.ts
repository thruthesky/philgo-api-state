import { State, Action, StateContext } from '@ngxs/store';
import { ApiUserInformation } from 'libs/philgo-api/philgo-api-interface';
import { UserProfile } from './user.action';


@State<ApiUserInformation>({
  name: 'user',
  defaults: {} as any
})
export class UserState {

  /**
   * Saves user profile information into the state
   * @param ctx ctx
   * @param user user
   */
  @Action(UserProfile) profile(ctx: StateContext<ApiUserInformation>, userObj: UserProfile) {
    console.log('userObj: ', userObj);
    ctx.patchState(userObj as any);
  }
}



