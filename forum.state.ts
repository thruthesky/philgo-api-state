import { State, NgxsOnInit, Action, StateContext } from '@ngxs/store';
import { ApiPost, ApiPostSearch } from '@libs/philgo-api/philgo-api-interface';
import { PostSearch } from './forum.action';
import { PhilGoApiService } from '@libs/philgo-api/philgo-api.service';

export interface ForumList {
  [key: string]: string[];

}

export interface ForumStateModel {
  postList: ApiPost[];
  forumList: ForumList;
}


@State<ForumStateModel>({
  name: 'forum',
  defaults: {
    postList: [],
    forumList: {}
  }
})

export class ForumState implements NgxsOnInit {

  constructor(private philgo: PhilGoApiService) { }

  ngxsOnInit() { }

  generateIdCategory(opts: ApiPostSearch | ApiPost): string {
    return opts.category ? opts.post_id + '.' + opts.category : opts.post_id;
  }

  @Action(PostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOptions }: PostSearch) {
    if (!searchOptions.limit) {
      searchOptions.limit = 10;
    }

    if (!searchOptions.page_no) {
      searchOptions.page_no = 1;
    }

    searchOptions.deleted = 0;
    this.philgo.postSearch(searchOptions).subscribe(
      res => {

        console.log(res);

      },
      e => {
        console.log('something went wrong!', e);
        alert(e.message);
      }
    );

  }
}
