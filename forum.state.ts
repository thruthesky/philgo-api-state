import { AppService } from '@libs/app.service';
import { ApiPost } from '@libs/philgo-api/philgo-api-interface';
import { State, Action, StateContext, Selector, Select } from '@ngxs/store';
import { ForumPostSearch, ForumPostCreate, ForumPostView } from './forum.action';
import { tap } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';

export interface ForumStateModel {
  postList: ApiPost[];
  forumList: {
    [key: string]: string[];
  };
  loading: {
    [key: string]: boolean;
  };
  page_no: {
    [key: string]: number;
  };
  postOnView: ApiPost;
}

@State<ForumStateModel>({
  name: 'forum',
  defaults: {
    postList: [],
    forumList: {},
    loading: {},
    page_no: {},
    postOnView: {}
  } as any
})
export class ForumState {

  @Selector()
  static forumPosts(forum: ForumStateModel) {
    return forum;
  }

  constructor(
    private a: AppService,
    private domSanitizer: DomSanitizer
  ) {
  }

  pre(post: ApiPost): ApiPost {
    post.bad = post.bad !== '0' ? post.bad : null;
    post.good = post.good !== '0' ? post.good : null;
    post['replyTo'] = post.idx;

    if (!post.subject || post.subject === '') {
      post.subject = 'No Subject';
    }

    if (post.member && post.member.idx === this.a.user.idx) {
      post.mine = true;
    }

    post['safeContent'] = this.domSanitizer.bypassSecurityTrustHtml(post.content);

    return post;
  }

  addPost({ getState, patchState }: StateContext<ForumStateModel>, post: ApiPost, idCategory: string, top = false) {
    this.pre(post);

    const posts = { ...getState().postList };
    const forums = { ...getState().forumList };

    posts[post.idx] = post;

    if (forums[idCategory] === void 0) {
      forums[idCategory] = [post.idx];
    } else {
      forums[idCategory] = [...getState().forumList[idCategory]];
    }

    if (forums[idCategory].indexOf(post.idx) === -1) {
      top ? forums[idCategory].unshift(post.idx) : forums[idCategory].push(post.idx);
    }

    patchState({
      postList: posts,
      forumList: forums
    });
  }

  @Action(ForumPostSearch) postSearch(ctx: StateContext<ForumStateModel>, { searchOption }: ForumPostSearch) {
    const state = ctx.getState();


    const idCategory = this.a.generateIdCategory(searchOption);


    if (state.loading[idCategory]) {
      return;
    }

    if (state.page_no[idCategory] === searchOption.page_no) {
      return;
    }

    if (!searchOption.page_no) {
      searchOption.page_no = 1;
    }

    ctx.patchState({
      page_no: { [idCategory]: searchOption.page_no }
    });

    if (!searchOption.limit) {
      searchOption.limit = 10;
    }

    return this.a.philgo.postSearch(searchOption)
      .pipe(
        tap(res => {
          // console.log(res);
          res.posts.forEach(
            post => {
              this.addPost(ctx, post, idCategory);
            });
        })
      );
  }

  @Action(ForumPostCreate) postCreate(ctx: StateContext<ForumStateModel>, { post, idCategory }: ForumPostCreate) {
    return this.a.philgo.postCreate(post).pipe(
      tap(res => {
        this.addPost(ctx, res, idCategory, true);
      })
    );
  }

  @Action(ForumPostView) postLoad(ctx: StateContext<ForumStateModel>, { idx }: ForumPostView) {
    const state = ctx.getState();

    // if post exists
    if (state.postList[idx]) {
      ctx.patchState({
        postOnView: state.postList[idx]
      });
      return;
    }

    // if not
    return this.a.philgo.postLoad(idx).pipe(
      tap(post => {
        const idCategory = this.a.generateIdCategory(post as any);
        this.pre(post);
        ctx.patchState({
          postOnView: post
        });
      })
    );
  }
}
