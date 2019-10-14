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

export class ForumPostUpdate {
  static readonly type = '[Forum] Post Update';

  constructor(public post: ApiPost) { }
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



export class ForumCommentCreate {
  static readonly type = '[Forum] Comment Create';

  constructor(public comment: ApiComment) {}
}

export class ForumCommentUpdate {
  static readonly type = '[Forum] Comment Update';

  constructor(public comment: ApiComment) {}
}