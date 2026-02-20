package handler_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/otoritech/telequran/backend/handler"
	"github.com/otoritech/telequran/backend/service"
)

func newTestQuranHandler(t *testing.T) *handler.QuranHandler {
	t.Helper()
	dataPath := filepath.Join("..", "..", "data", "quran.json")
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		t.Fatalf("quran.json not found at %s", dataPath)
	}
	svc, err := service.NewQuranService(dataPath)
	if err != nil {
		t.Fatalf("failed to create quran service: %v", err)
	}
	return handler.NewQuranHandler(svc)
}

func TestGetMeta_Returns114Surahs(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/meta", nil)
	w := httptest.NewRecorder()
	qh.GetMeta(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var body struct {
		Success bool `json:"success"`
		Data    []struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			AyahCount int    `json:"ayahCount"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	if !body.Success {
		t.Fatal("expected success=true")
	}
	if len(body.Data) != 114 {
		t.Fatalf("expected 114 surahs, got %d", len(body.Data))
	}
}

func TestGetMeta_FirstSurahIsAlFatihah(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/meta", nil)
	w := httptest.NewRecorder()
	qh.GetMeta(w, req)

	var body struct {
		Data []struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			AyahCount int    `json:"ayahCount"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	if body.Data[0].LatinName != "Al-Fatihah" {
		t.Errorf("expected Al-Fatihah, got %s", body.Data[0].LatinName)
	}
	if body.Data[0].AyahCount != 7 {
		t.Errorf("expected 7 ayahs, got %d", body.Data[0].AyahCount)
	}
}

func TestGetMeta_LastSurahIsAnNas(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/meta", nil)
	w := httptest.NewRecorder()
	qh.GetMeta(w, req)

	var body struct {
		Data []struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			AyahCount int    `json:"ayahCount"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	last := body.Data[len(body.Data)-1]
	if last.LatinName != "An-Nas" {
		t.Errorf("expected An-Nas, got %s", last.LatinName)
	}
	if last.AyahCount != 6 {
		t.Errorf("expected 6 ayahs, got %d", last.AyahCount)
	}
}

func TestGetMeta_MethodNotAllowed(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/quran/meta", nil)
	w := httptest.NewRecorder()
	qh.GetMeta(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w.Code)
	}
}

func TestGetSurah_AlFatihah(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/surah/1", nil)
	w := httptest.NewRecorder()
	qh.GetSurah(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var body struct {
		Success bool `json:"success"`
		Data    struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			Ayahs     []struct {
				Number int    `json:"number"`
				Text   string `json:"text"`
			} `json:"ayahs"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	if !body.Success {
		t.Fatal("expected success=true")
	}
	if body.Data.Number != 1 {
		t.Errorf("expected number=1, got %d", body.Data.Number)
	}
	if body.Data.LatinName != "Al-Fatihah" {
		t.Errorf("expected Al-Fatihah, got %s", body.Data.LatinName)
	}
	if len(body.Data.Ayahs) != 7 {
		t.Errorf("expected 7 ayahs, got %d", len(body.Data.Ayahs))
	}
}

func TestGetSurah_AlIkhlas(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/surah/112", nil)
	w := httptest.NewRecorder()
	qh.GetSurah(w, req)

	var body struct {
		Data struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			Ayahs     []struct {
				Number int `json:"number"`
			} `json:"ayahs"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	if body.Data.Number != 112 {
		t.Errorf("expected number=112, got %d", body.Data.Number)
	}
	if body.Data.LatinName != "Al-Ikhlas" {
		t.Errorf("expected Al-Ikhlas, got %s", body.Data.LatinName)
	}
	if len(body.Data.Ayahs) != 4 {
		t.Errorf("expected 4 ayahs, got %d", len(body.Data.Ayahs))
	}
}

func TestGetSurah_AnNas(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/api/quran/surah/114", nil)
	w := httptest.NewRecorder()
	qh.GetSurah(w, req)

	var body struct {
		Data struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			Ayahs     []struct {
				Number int `json:"number"`
			} `json:"ayahs"`
		} `json:"data"`
	}
	json.NewDecoder(w.Body).Decode(&body)
	if body.Data.Number != 114 {
		t.Errorf("expected number=114, got %d", body.Data.Number)
	}
	if len(body.Data.Ayahs) != 6 {
		t.Errorf("expected 6 ayahs, got %d", len(body.Data.Ayahs))
	}
}

func TestGetSurah_ErrorCases(t *testing.T) {
	qh := newTestQuranHandler(t)
	tests := []struct {
		name string
		path string
	}{
		{"zero", "/api/quran/surah/0"},
		{"negative", "/api/quran/surah/-1"},
		{"too high", "/api/quran/surah/115"},
		{"non-numeric", "/api/quran/surah/abc"},
		{"empty", "/api/quran/surah/"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			w := httptest.NewRecorder()
			qh.GetSurah(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d for path %s", w.Code, tt.path)
			}
			var body struct {
				Success bool   `json:"success"`
				Error   string `json:"error"`
			}
			json.NewDecoder(w.Body).Decode(&body)
			if body.Success {
				t.Error("expected success=false")
			}
			if body.Error == "" {
				t.Error("expected error message")
			}
		})
	}
}

func TestGetSurah_MethodNotAllowed(t *testing.T) {
	qh := newTestQuranHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/quran/surah/1", nil)
	w := httptest.NewRecorder()
	qh.GetSurah(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w.Code)
	}
}

func TestGetSurah_ContentType(t *testing.T) {
	qh := newTestQuranHandler(t)
	paths := []string{"/api/quran/surah/1", "/api/quran/surah/114"}
	for _, path := range paths {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			w := httptest.NewRecorder()
			qh.GetSurah(w, req)

			ct := w.Header().Get("Content-Type")
			if ct != "application/json" {
				t.Errorf("expected Content-Type application/json, got %s", ct)
			}
		})
	}
}

func TestGetSurah_AyahSequentialNumbers(t *testing.T) {
	qh := newTestQuranHandler(t)
	surahNumbers := []int{1, 36, 55, 114}
	for _, num := range surahNumbers {
		t.Run(fmt.Sprintf("surah_%d", num), func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/quran/surah/%d", num), nil)
			w := httptest.NewRecorder()
			qh.GetSurah(w, req)

			var body struct {
				Data struct {
					Ayahs []struct {
						Number int `json:"number"`
					} `json:"ayahs"`
				} `json:"data"`
			}
			json.NewDecoder(w.Body).Decode(&body)
			for i, ayah := range body.Data.Ayahs {
				if ayah.Number != i+1 {
					t.Errorf("ayah at index %d: expected number=%d, got %d", i, i+1, ayah.Number)
				}
			}
		})
	}
}
