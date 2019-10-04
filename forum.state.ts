import { AppService } from '@libs/app.service';
import { ApiPost } from '@libs/philgo-api/philgo-api-interface';
import { State, Action, StateContext } from '@ngxs/store';
import { ForumPostSearch } from './forum.action';
import { tap } from 'rxjs/operators';


export interface ForumStateModel {
  posts: {
    [key: string]: ApiPost
  };
}


@State<ForumStateModel>({
  name: 'forum',
  defaults: {} as any
})
export class ForumState {

  constructor(
    private a: AppService
  ) {
  }

  @Action(ForumPostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOption }: ForumPostSearch) {

    if ( !searchOption.limit ) {
      searchOption.limit = 10;
    }
    if ( !searchOption.page_no ) {
      searchOption.page_no = 1;
    }

    return this.a.philgo.postSearch(searchOption)
      .pipe(
        tap(res => {
          console.log(res);
        })
      );
  }

}
