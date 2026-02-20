package handler

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

var startTime = time.Now()

type healthResponse struct {
	Status string `json:"status"`
	Uptime string `json:"uptime"`
	GoVer  string `json:"goVersion"`
}

// GET /api/health
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(healthResponse{
		Status: "ok",
		Uptime: time.Since(startTime).Round(time.Second).String(),
		GoVer:  runtime.Version(),
	})
}
