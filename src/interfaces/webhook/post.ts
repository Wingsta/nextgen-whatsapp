 interface From {
  id: string;
  username: string;
}

 interface Media {
  id: string;
  media_product_type: string;
}

 interface Value {
  from: From;
  media: Media;
  id: string;
  parent_id: string;
  text: string;
}

 interface Change {
  field: 'comments';
  value: Value;
}

export interface Entry {
  id: string;
  time: number;
  changes: Change[];
}

export interface IWebhook {
  object: 'instagram';
  entry: Entry[];
}
