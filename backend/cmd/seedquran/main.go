package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// API response structures
type APIResponse struct {
	Code   int       `json:"code"`
	Status string    `json:"status"`
	Data   SurahData `json:"data"`
}

type SurahData struct {
	Number         int    `json:"number"`
	Name           string `json:"name"`
	EnglishName    string `json:"englishName"`
	NumberOfAyahs  int    `json:"numberOfAyahs"`
	RevelationType string `json:"revelationType"`
	Ayahs          []Ayah `json:"ayahs"`
}

type Ayah struct {
	Number        int    `json:"number"`
	Text          string `json:"text"`
	NumberInSurah int    `json:"numberInSurah"`
	Juz           int    `json:"juz"`
	Page          int    `json:"page"`
	HizbQuarter   int    `json:"hizbQuarter"`
}

// Output structures
type SurahMeta struct {
	Number         int    `json:"number"`
	Name           string `json:"name"`
	LatinName      string `json:"latinName"`
	EnglishName    string `json:"englishName"`
	AyahCount      int    `json:"ayahCount"`
	RevelationType string `json:"revelationType"`
}

type SurahFull struct {
	Number         int       `json:"number"`
	Name           string    `json:"name"`
	LatinName      string    `json:"latinName"`
	EnglishName    string    `json:"englishName"`
	AyahCount      int       `json:"ayahCount"`
	RevelationType string    `json:"revelationType"`
	Ayahs          []AyahOut `json:"ayahs"`
}

type AyahOut struct {
	Number int    `json:"number"`
	Text   string `json:"text"`
	Juz    int    `json:"juz"`
	Page   int    `json:"page"`
}

type QuranData struct {
	Surahs []SurahFull `json:"surahs"`
}

// Latin names for all 114 surahs
var latinNames = map[int]string{
	1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa", 5: "Al-Ma'idah",
	6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Taubah", 10: "Yunus",
	11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
	16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Taha",
	21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
	26: "Asy-Syu'ara", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-'Ankabut", 30: "Ar-Rum",
	31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba", 35: "Fatir",
	36: "Yasin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
	41: "Fussilat", 42: "Asy-Syura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jasiyah",
	46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
	51: "Az-Zariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
	56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadilah", 59: "Al-Hasyr", 60: "Al-Mumtahanah",
	61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Tagabun", 65: "At-Talaq",
	66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
	71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddassir", 75: "Al-Qiyamah",
	76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "'Abasa",
	81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Insyiqaq", 85: "Al-Buruj",
	86: "At-Tariq", 87: "Al-A'la", 88: "Al-Gasyiyah", 89: "Al-Fajr", 90: "Al-Balad",
	91: "Asy-Syams", 92: "Al-Lail", 93: "Ad-Duha", 94: "Asy-Syarh", 95: "At-Tin",
	96: "Al-'Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-'Adiyat",
	101: "Al-Qari'ah", 102: "At-Takasur", 103: "Al-'Asr", 104: "Al-Humazah", 105: "Al-Fil",
	106: "Quraisy", 107: "Al-Ma'un", 108: "Al-Kausar", 109: "Al-Kafirun", 110: "An-Nasr",
	111: "Al-Masad", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas",
}

func main() {
	dataDir := filepath.Join("..", "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating data dir: %v\n", err)
		os.Exit(1)
	}

	quranData := QuranData{
		Surahs: make([]SurahFull, 0, 114),
	}

	client := &http.Client{Timeout: 30 * time.Second}

	for i := 1; i <= 114; i++ {
		fmt.Printf("Downloading surah %d/114...\n", i)

		url := fmt.Sprintf("https://api.alquran.cloud/v1/surah/%d", i)
		resp, err := client.Get(url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error fetching surah %d: %v\n", i, err)
			os.Exit(1)
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading response for surah %d: %v\n", i, err)
			os.Exit(1)
		}

		var apiResp APIResponse
		if err := json.Unmarshal(body, &apiResp); err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing JSON for surah %d: %v\n", i, err)
			os.Exit(1)
		}

		if apiResp.Code != 200 {
			fmt.Fprintf(os.Stderr, "API error for surah %d: status=%s\n", i, apiResp.Status)
			os.Exit(1)
		}

		surah := apiResp.Data
		latin := latinNames[surah.Number]
		if latin == "" {
			latin = surah.EnglishName
		}

		ayahs := make([]AyahOut, 0, len(surah.Ayahs))
		for _, a := range surah.Ayahs {
			ayahs = append(ayahs, AyahOut{
				Number: a.NumberInSurah,
				Text:   a.Text,
				Juz:    a.Juz,
				Page:   a.Page,
			})
		}

		quranData.Surahs = append(quranData.Surahs, SurahFull{
			Number:         surah.Number,
			Name:           surah.Name,
			LatinName:      latin,
			EnglishName:    surah.EnglishName,
			AyahCount:      surah.NumberOfAyahs,
			RevelationType: surah.RevelationType,
			Ayahs:          ayahs,
		})

		// Be nice to the API
		if i < 114 {
			time.Sleep(200 * time.Millisecond)
		}
	}

	// Write full quran data
	quranJSON, err := json.MarshalIndent(quranData, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling quran data: %v\n", err)
		os.Exit(1)
	}

	quranPath := filepath.Join(dataDir, "quran.json")
	if err := os.WriteFile(quranPath, quranJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error writing quran.json: %v\n", err)
		os.Exit(1)
	}

	// Also write a meta-only file (for listing)
	metas := make([]SurahMeta, 0, 114)
	for _, s := range quranData.Surahs {
		metas = append(metas, SurahMeta{
			Number:         s.Number,
			Name:           s.Name,
			LatinName:      s.LatinName,
			EnglishName:    s.EnglishName,
			AyahCount:      s.AyahCount,
			RevelationType: s.RevelationType,
		})
	}

	metaJSON, err := json.MarshalIndent(metas, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling meta: %v\n", err)
		os.Exit(1)
	}

	metaPath := filepath.Join(dataDir, "surah-meta.json")
	if err := os.WriteFile(metaPath, metaJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error writing surah-meta.json: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\nDone. Written:\n")
	fmt.Printf("  - %s (%d bytes)\n", quranPath, len(quranJSON))
	fmt.Printf("  - %s (%d bytes)\n", metaPath, len(metaJSON))
	fmt.Printf("  Total surahs: %d\n", len(quranData.Surahs))

	totalAyahs := 0
	for _, s := range quranData.Surahs {
		totalAyahs += len(s.Ayahs)
	}
	fmt.Printf("  Total ayahs: %d\n", totalAyahs)
}
