export type SourceStatus = "transcript-ready" | "queued" | "needs-attention" | "complete";

export type Video = {
  index: number;
  id: string;
  title: string;
  url: string;
  duration: number | null;
  playlist: string;
};

export type Cluster = {
  name: string;
  videoIds: string[];
};

export type Source = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  status: SourceStatus;
  tags: string[];
  added: string;
  transcript: string;
  url: string;
  videos: Video[];
  clusters: Cluster[];
};

export type Packet = {
  id: string;
  title: string;
  question: string;
  sourceIds: string[];
  brief: string;
  createdAt: string;
};
