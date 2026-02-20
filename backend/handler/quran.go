package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/otoritech/telequran/backend/service"
)

type QuranHandler struct {
	svc *service.QuranService
}

func NewQuranHandler(svc *service.QuranService) *QuranHandler {
	return &QuranHandler{svc: svc}
}

type apiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, resp apiResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// GetMeta handles GET /api/quran/meta
func (h *QuranHandler) GetMeta(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Error: "method not allowed"})
		return
	}

	metas := h.svc.GetAllMeta()
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: metas})
}

// GetSurah handles GET /api/quran/surah/{number}
func (h *QuranHandler) GetSurah(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Error: "method not allowed"})
		return
	}

	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/quran/surah/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: "surah number required"})
		return
	}

	num, err := strconv.Atoi(parts[0])
	if err != nil || num < 1 || num > 114 {
		writeJSON(w, http.StatusBadRequest, apiResponse{Error: "invalid surah number (1-114)"})
		return
	}

	surah, err := h.svc.GetSurah(num)
	if err != nil {
		writeJSON(w, http.StatusNotFound, apiResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: surah})
}
