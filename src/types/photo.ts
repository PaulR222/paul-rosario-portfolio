export type PhotoVariant = {
  src: string;
  width: number;
};

export type Photo = {
  id: string;
  archiveNumber: number;
  src: string;
  width?: number;
  height?: number;
  dateTaken?: string;
  location?: string;
  camera?: string;
  lens?: string;
  caption?: string;
  alt?: string;
  album?: string;
  featured?: boolean;
  variants?: PhotoVariant[];
  sourceHash?: string;
};
