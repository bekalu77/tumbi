import { ItemWithRelations, Company, Job } from "@shared/schema";

export type Product = ItemWithRelations;

export interface Tender {
  id: string;
  tenderNo: number;
  title: string;
  bidOpeningDate: string;
  region: string;
  category: string;
  publishedOn: string;
  featured?: boolean;
  content: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published_date: string;
  author: string;
  fileType?: 'md' | 'html';
  image?: string;
  read_time?: string;
  featured?: boolean;
  views?: number;
}

export interface Ad {
  id: string;
  title: string;
  link: string;
  banner: string;
  status: 'on' | 'off';
}

export interface ApiError {
  error: string;
  message?: string;
}
