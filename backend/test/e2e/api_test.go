package e2e_test

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

func setupServer(t *testing.T) *httptest.Server {
	t.Helper()
	dataPath := filepath.Join("..", "..", "..", "data", "quran.json")
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		t.Fatalf("quran.json not found at %s", dataPath)
	}
	svc, err := service.NewQuranService(dataPath)
	if err != nil {
		t.Fatalf("failed to create quran service: %v", err)
	}
	qh := handler.NewQuranHandler(svc)
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handler.HealthCheck)
	mux.HandleFunc("/api/quran/meta", qh.GetMeta)
	mux.HandleFunc("/api/quran/surah/", qh.GetSurah)
	return httptest.NewServer(mux)
}

func TestE2E_HealthEndpoint(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Get(srv.URL + "/api/health")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	var body map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&body)
	if body["status"] != "ok" {
		t.Errorf("expected status ok, got %v", body["status"])
	}
	if _, ok := body["uptime"]; !ok {
		t.Error("expected uptime field")
	}
	if _, ok := body["goVersion"]; !ok {
		t.Error("expected goVersion field")
	}
}

func TestE2E_HealthEndpoint_MethodNotAllowed(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Post(srv.URL+"/api/health", "application/json", nil)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", resp.StatusCode)
	}
}

func TestE2E_MetaEndpoint_Returns114Surahs(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Get(srv.URL + "/api/quran/meta")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
	var body struct {
		Success bool `json:"success"`
		Data    []struct {
			Number    int    `json:"number"`
			LatinName string `json:"latinName"`
			AyahCount int    `json:"ayahCount"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&body)
	if !body.Success {
		t.Fatal("expected success=true")
	}
	if len(body.Data) != 114 {
		t.Fatalf("expected 114 surahs, got %d", len(body.Data))
	}
	// Verify sequential numbering
	for i, s := range body.Data {
		if s.Number != i+1 {
			t.Errorf("surah at index %d: expected number=%d, got %d", i, i+1, s.Number)
		}
	}
	// Verify specific surahs
	if body.Data[0].LatinName != "Al-Fatihah" {
		t.Errorf("expected first surah Al-Fatihah, got %s", body.Data[0].LatinName)
	}
	if body.Data[0].AyahCount != 7 {
		t.Errorf("expected Al-Fatihah ayahCount=7, got %d", body.Data[0].AyahCount)
	}
	if body.Data[113].LatinName != "An-Nas" {
		t.Errorf("expected last surah An-Nas, got %s", body.Data[113].LatinName)
	}
	if body.Data[113].AyahCount != 6 {
		t.Errorf("expected An-Nas ayahCount=6, got %d", body.Data[113].AyahCount)
	}
}

func TestE2E_MetaEndpoint_ContentType(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Get(srv.URL + "/api/quran/meta")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	ct := resp.Header.Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", ct)
	}
}

func TestE2E_SurahEndpoint_MultipleSurahs(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	tests := []struct {
		number    int
		latinName string
		ayahCount int
	}{
		{1, "Al-Fatihah", 7},
		{2, "Al-Baqarah", 286},
		{36, "Yasin", 83},
		{55, "Ar-Rahman", 78},
		{67, "Al-Mulk", 30},
		{78, "An-Naba", 40},
		{112, "Al-Ikhlas", 4},
		{113, "Al-Falaq", 5},
		{114, "An-Nas", 6},
	}
	for _, tt := range tests {
		t.Run(tt.latinName, func(t *testing.T) {
			url := fmt.Sprintf("%s/api/quran/surah/%d", srv.URL, tt.number)
			resp, err := http.Get(url)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				t.Errorf("expected 200, got %d", resp.StatusCode)
			}
			var body struct {
				Success bool `json:"success"`
				Data    struct {
					Number    int    `json:"number"`
					LatinName string `json:"latinName"`
					AyahCount int    `json:"ayahCount"`
					Ayahs     []struct {
						Number int    `json:"number"`
						Text   string `json:"text"`
						Juz    int    `json:"juz"`
						Page   int    `json:"page"`
					} `json:"ayahs"`
				} `json:"data"`
			}
			json.NewDecoder(resp.Body).Decode(&body)
			if !body.Success {
				t.Fatal("expected success=true")
			}
			if body.Data.Number != tt.number {
				t.Errorf("expected number=%d, got %d", tt.number, body.Data.Number)
			}
			if body.Data.LatinName != tt.latinName {
				t.Errorf("expected latinName=%s, got %s", tt.latinName, body.Data.LatinName)
			}
			if len(body.Data.Ayahs) != tt.ayahCount {
				t.Errorf("expected %d ayahs, got %d", tt.ayahCount, len(body.Data.Ayahs))
			}
			// Verify ayah integrity
			for i, ayah := range body.Data.Ayahs {
				if ayah.Number != i+1 {
					t.Errorf("ayah at index %d: expected number=%d, got %d", i, i+1, ayah.Number)
				}
				if ayah.Text == "" {
					t.Errorf("ayah %d has empty text", ayah.Number)
				}
				if ayah.Juz < 1 || ayah.Juz > 30 {
					t.Errorf("ayah %d has invalid juz=%d", ayah.Number, ayah.Juz)
				}
				if ayah.Page < 1 {
					t.Errorf("ayah %d has invalid page=%d", ayah.Number, ayah.Page)
				}
			}
		})
	}
}

func TestE2E_SurahEndpoint_ErrorCases(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	tests := []struct {
		name string
		path string
		code int
	}{
		{"zero", "/api/quran/surah/0", http.StatusBadRequest},
		{"too high", "/api/quran/surah/115", http.StatusBadRequest},
		{"very high", "/api/quran/surah/999", http.StatusBadRequest},
		{"non-numeric", "/api/quran/surah/abc", http.StatusBadRequest},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := http.Get(srv.URL + tt.path)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			defer resp.Body.Close()
			if resp.StatusCode != tt.code {
				t.Errorf("expected %d, got %d", tt.code, resp.StatusCode)
			}
			var body struct {
				Success bool   `json:"success"`
				Error   string `json:"error"`
			}
			json.NewDecoder(resp.Body).Decode(&body)
			if body.Success {
				t.Error("expected success=false")
			}
			if body.Error == "" {
				t.Error("expected error message")
			}
		})
	}
}

func TestE2E_SurahEndpoint_MethodNotAllowed(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Post(srv.URL+"/api/quran/surah/1", "application/json", nil)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", resp.StatusCode)
	}
}

func TestE2E_TotalAyahCount(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	resp, err := http.Get(srv.URL + "/api/quran/meta")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	var body struct {
		Data []struct {
			AyahCount int `json:"ayahCount"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&body)
	totalAyahs := 0
	for _, s := range body.Data {
		totalAyahs += s.AyahCount
	}
	if totalAyahs != 6236 {
		t.Errorf("expected total ayahs=6236, got %d", totalAyahs)
	}
}

func TestE2E_AllEndpoints_ReturnJSON(t *testing.T) {
	srv := setupServer(t)
	defer srv.Close()
	endpoints := []string{
		"/api/health",
		"/api/quran/meta",
		"/api/quran/surah/1",
		"/api/quran/surah/114",
	}
	for _, ep := range endpoints {
		t.Run(ep, func(t *testing.T) {
			resp, err := http.Get(srv.URL + ep)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			defer resp.Body.Close()
			ct := resp.Header.Get("Content-Type")
			if ct != "application/json" {
				t.Errorf("expected Content-Type application/json, got %s", ct)
			}
		})
	}
}
