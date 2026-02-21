/**
 * Web Speech API hook for Arabic speech recognition.
 *
 * Uses webkitSpeechRecognition (Chrome/Edge) or SpeechRecognition (Firefox)
 * with Arabic (Saudi) language setting, continuous mode, and interim results.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { combinedSimilarity, tokenOverlap, levenshteinSimilarity } from '@/lib/textSimilarity';
import { normalizeArabic } from '@/lib/arabicUtils';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const SIMILARITY_THRESHOLD = 0.45;

interface UseSpeechRecognitionOptions {
  /** Target ayat text to compare against */
  targetText: string;
  /** Called when similarity threshold is met */
  onMatch: () => void;
  /** Whether recognition is active */
  active: boolean;
}

interface UseSpeechRecognitionResult {
  /** Whether Web Speech API is supported */
  supported: boolean;
  /** Whether recognition is currently listening */
  listening: boolean;
  /** Current transcript (interim + final) */
  transcript: string;
  /** Current similarity score (0-1) */
  similarity: number;
  /** Error message if any */
  error: string | null;
}

export function useSpeechRecognition({
  targetText,
  onMatch,
  active,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [similarity, setSimilarity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const matchedRef = useRef(false);
  const fatalErrorRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SpeechRecognition = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

  const supported = SpeechRecognition != null;

  // Reset state when target changes
  useEffect(() => {
    setTranscript('');
    setSimilarity(0);
    matchedRef.current = false;
    fatalErrorRef.current = false;
  }, [targetText]);

  const startRecognition = useCallback(() => {
    console.log('[Speech] startRecognition called, SpeechRecognition:', !!SpeechRecognition, 'active:', active);
    if (!SpeechRecognition || !active) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('[Speech] Recognition started successfully');
        setListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let fullTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        setTranscript(fullTranscript);

        if (targetText && !matchedRef.current) {
          const score = combinedSimilarity(fullTranscript, targetText);
          const overlap = tokenOverlap(fullTranscript, targetText);
          const lev = levenshteinSimilarity(fullTranscript, targetText);
          setSimilarity(score);

          console.log('[Speech] Transcript:', fullTranscript);
          console.log('[Speech] Target (normalized):', normalizeArabic(targetText));
          console.log('[Speech] Scores - combined:', score.toFixed(3),
            'overlap:', overlap.toFixed(3), 'levenshtein:', lev.toFixed(3));

          if (score >= SIMILARITY_THRESHOLD) {
            console.log('[Speech] MATCH - advancing ayat');
            matchedRef.current = true;
            onMatch();
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' and 'aborted' are not real errors
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        console.warn('[Speech] Error:', event.error);
        setError(event.error);
        setListening(false);
        // Don't auto-restart on permission or fatal errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          fatalErrorRef.current = true;
        }
      };

      recognition.onend = () => {
        // Don't set listening=false during auto-restart to avoid flicker
        // Only stop listening if we're truly done (not active anymore)
        if (!active || matchedRef.current || fatalErrorRef.current) {
          setListening(false);
        }
        // Auto-restart if still active (Web Speech API times out)
        if (active && !matchedRef.current && !fatalErrorRef.current) {
          restartTimerRef.current = setTimeout(() => {
            startRecognition();
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[Speech] Failed to start:', err);
      setError('Failed to start speech recognition');
    }
  }, [SpeechRecognition, active, targetText, onMatch]);

  // Start/stop based on active prop
  useEffect(() => {
    console.log('[Speech] Effect: active=', active, 'supported=', supported);
    if (active && supported) {
      startRecognition();
    }

    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setListening(false);
    };
  }, [active, supported, startRecognition]);

  return { supported, listening, transcript, similarity, error };
}
