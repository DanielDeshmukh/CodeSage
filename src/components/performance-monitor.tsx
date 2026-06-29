"use client";

import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  CLS: number;
  TTFB: number;
  FID: number;
}

function reportMetrics(metrics: PerformanceMetrics): void {
  if (typeof window === "undefined") return;

  console.log("[Performance]", metrics);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/metrics",
      JSON.stringify({
        ...metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      })
    );
  }
}

export function PerformanceMonitor() {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;

    const metrics: Partial<PerformanceMetrics> = {};

    const paintEntries = performance.getEntriesByType("paint");
    const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
    if (fcp) metrics.FCP = Math.round(fcp.startTime);

    const ttfb = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (ttfb) metrics.TTFB = Math.round(ttfb.responseStart - ttfb.requestStart);

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.LCP = Math.round(lastEntry.startTime);
      }
    });

    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP not supported
    }

    const clsObserver = new PerformanceObserver((entryList) => {
      let cls = 0;
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
      metrics.CLS = Math.round(cls * 1000) / 1000;
    });

    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // CLS not supported
    }

    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        metrics.FID = Math.round(
          (entries[0] as any).processingStart - entries[0].startTime
        );
      }
    });

    try {
      fidObserver.observe({ type: "first-input", buffered: true });
    } catch {
      // FID not supported
    }

    const timer = setTimeout(() => {
      reportMetrics(metrics as PerformanceMetrics);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
    }, 5000);

    return () => {
      clearTimeout(timer);
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);

  return null;
}
