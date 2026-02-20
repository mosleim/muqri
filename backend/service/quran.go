package service

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// SurahMeta contains surah metadata without ayahs.
type SurahMeta struct {
	Number         int    `json:"number"`
	Name           string `json:"name"`
	LatinName      string `json:"latinName"`
	EnglishName    string `json:"englishName"`
	AyahCount      int    `json:"ayahCount"`
	RevelationType string `json:"revelationType"`
}

// Ayah represents a single verse.
type Ayah struct {
	Number int    `json:"number"`
	Text   string `json:"text"`
	Juz    int    `json:"juz"`
	Page   int    `json:"page"`
}

// SurahFull contains surah data including all ayahs.
type SurahFull struct {
	Number         int    `json:"number"`
	Name           string `json:"name"`
	LatinName      string `json:"latinName"`
	EnglishName    string `json:"englishName"`
	AyahCount      int    `json:"ayahCount"`
	RevelationType string `json:"revelationType"`
	Ayahs          []Ayah `json:"ayahs"`
}

// QuranData holds all surahs.
type QuranData struct {
	Surahs []SurahFull `json:"surahs"`
}

// QuranService provides access to Quran data.
type QuranService struct {
	data    *QuranData
	metaMap map[int]*SurahFull
	mu      sync.RWMutex
}

// NewQuranService loads Quran data from a JSON file.
func NewQuranService(dataPath string) (*QuranService, error) {
	raw, err := os.ReadFile(dataPath)
	if err != nil {
		return nil, fmt.Errorf("reading quran data: %w", err)
	}

	var data QuranData
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("parsing quran data: %w", err)
	}

	metaMap := make(map[int]*SurahFull, len(data.Surahs))
	for i := range data.Surahs {
		metaMap[data.Surahs[i].Number] = &data.Surahs[i]
	}

	return &QuranService{
		data:    &data,
		metaMap: metaMap,
	}, nil
}

// GetAllMeta returns metadata for all 114 surahs.
func (s *QuranService) GetAllMeta() []SurahMeta {
	s.mu.RLock()
	defer s.mu.RUnlock()

	metas := make([]SurahMeta, 0, len(s.data.Surahs))
	for _, surah := range s.data.Surahs {
		metas = append(metas, SurahMeta{
			Number:         surah.Number,
			Name:           surah.Name,
			LatinName:      surah.LatinName,
			EnglishName:    surah.EnglishName,
			AyahCount:      surah.AyahCount,
			RevelationType: surah.RevelationType,
		})
	}
	return metas
}

// GetSurah returns a single surah with all its ayahs.
func (s *QuranService) GetSurah(number int) (*SurahFull, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	surah, ok := s.metaMap[number]
	if !ok {
		return nil, fmt.Errorf("surah %d not found", number)
	}
	return surah, nil
}
