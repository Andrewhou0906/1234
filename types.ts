
export interface NewsArticle {
  id: number;
  channelId: string;
  title: string;
  content: string;
  date: string;
  imageUrl: string;
}

export interface NewsChannel {
  id: string;
  name: string;
}
