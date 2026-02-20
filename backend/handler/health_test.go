package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/otoritech/telequran/backend/handler"
)

func TestHealthCheck_ReturnsOK(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	handler.HealthCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var body map[string]interface{}
	json.NewDecoder(w.Body).Decode(&body)
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

func TestHealthCheck_ContentType(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	handler.HealthCheck(w, req)

	ct := w.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", ct)
	}
}

func TestHealthCheck_MethodNotAllowed(t *testing.T) {
	methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}
	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "/api/health", nil)
			w := httptest.NewRecorder()
			handler.HealthCheck(w, req)

			if w.Code != http.StatusMethodNotAllowed {
				t.Errorf("expected 405, got %d", w.Code)
			}
		})
	}
}
