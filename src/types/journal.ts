export type JournalPostStatus = 'draft' | 'published';

export interface JournalImage {
  id: string;
  post_id: string;
  organisation_id: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface JournalPost {
  id: string;
  event_id: string;
  organisation_id: string;
  title: string;
  content: string;
  status: JournalPostStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  trac_journal_images?: JournalImage[];
}

export interface JournalPostInsert {
  event_id: string;
  organisation_id: string;
  title: string;
  content: string;
  status?: JournalPostStatus;
  created_by: string;
  updated_by: string;
}

export interface JournalPostUpdate {
  title?: string;
  content?: string;
  status?: JournalPostStatus;
  updated_by: string;
}

export interface JournalImageInsert {
  post_id: string;
  organisation_id: string;
  created_by: string;
}
