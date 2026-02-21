export interface SurahMeta {
  number: number;
  name: string;
  latinName: string;
  englishName: string;
  ayahCount: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  juz?: number;
  page?: number;
}

export interface SurahFull extends SurahMeta {
  ayahs: Ayah[];
}
