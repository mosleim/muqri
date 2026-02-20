package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/otoritech/telequran/backend/handler"
	"github.com/otoritech/telequran/backend/service"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dataPath := os.Getenv("QURAN_DATA_PATH")
	if dataPath == "" {
		dataPath = filepath.Join("data", "quran.json")
	}

	// Init services
	quranSvc, err := service.NewQuranService(dataPath)
	if err != nil {
		log.Fatalf("Failed to load quran data: %v", err)
	}
	log.Println("Quran data loaded successfully")

	// Init handlers
	quranHandler := handler.NewQuranHandler(quranSvc)

	// Setup routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/health", handler.HealthCheck)
	mux.HandleFunc("/api/quran/meta", quranHandler.GetMeta)
	mux.HandleFunc("/api/quran/surah/", quranHandler.GetSurah)

	// Static files (React build output) — served from ../dist if exists
	distDir := filepath.Join("..", "dist")
	if _, err := os.Stat(distDir); err == nil {
		fs := http.FileServer(http.Dir(distDir))
		mux.Handle("/", fs)
		log.Printf("Serving static files from %s", distDir)
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"service":"telequran-backend","version":"1.0.0"}`)
		})
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsMiddleware(mux),
	}

	log.Printf("Telequran backend starting on http://localhost:%s", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
