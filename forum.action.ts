import { ApiPostSearch, ApiPost, ApiVote, ApiPostQuery, ApiComment } from '@libs/philgo-api/philgo-api-interface';

export class ForumPostSearch {
  static readonly type = '[Forum] Post Search';
  constructor(public searchOption: ApiPostSearch) { }
}


export class ForumPostView {
  static readonly type = '[Forum] Post View';

  constructor(public idx: string) { }
}

export class ForumPostCreate {
  static readonly type = '[Forum] Post Create';

  constructor(public post: ApiPost) { }
}

export class ForumCommentCreate {
  static readonly type = '[Forum] Comment Create';

  constructor(public comment: ApiComment) { }
}

export class ForumPostOrCommentUpdate {
  static readonly type = '[Forum] Update';

  constructor(public postOrComment: ApiPost | ApiComment) { }
}

export class ForumPostOrCommentVote {
  static readonly type = '[Forum] Vote';

  constructor(public vote: ApiVote, public postOrComment: ApiPost | ApiComment) { }
}

export class ForumPostOrCommentDelete {
  static readonly type = '[Forum] Delete';

  constructor(public postOrComment: ApiPost | ApiComment) { }
}

export class ForumBookmarkSearch {
  static readonly type = '[Forum] Bookmark Search';

  constructor(public searchOpts: ApiPostQuery) { }
}

export class ForumBookmarkUpdate {
  static readonly type = '[Forum] Bookmark Update';

  constructor(public bookmarklist: string[]) { }
}
