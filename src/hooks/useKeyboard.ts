"use client";
import { useEffect } from "react";
import { useStore } from "@/stores/useStore";

export function useKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const state = useStore.getState();

      switch (e.key) {
        // Space — pause/resume
        case " ":
          e.preventDefault();
          state.setPaused(!state.paused);
          break;

        // Escape — deselect satellite / close panels
        case "Escape":
          if (state.showLaunches) {
            state.setShowLaunches(false);
          } else if (state.showStats) {
            state.setShowStats(false);
          } else if (state.showPassPanel) {
            state.setShowPassPanel(false);
          } else if (state.selectedId) {
            state.setSelectedId(null);
            state.setFollowMode(false);
          } else if (state.leftPanelOpen) {
            state.setLeftPanelOpen(false);
          }
          break;

        // L — reset to live
        case "l":
        case "L":
          state.setTimeOffset(0);
          state.setSimSpeed(1);
          state.setPaused(false);
          break;

        // O — toggle orbits
        case "o":
        case "O":
          state.setShowOrbits(!state.showOrbits);
          break;

        // P — toggle pass prediction panel
        case "p":
        case "P":
          state.setShowPassPanel(!state.showPassPanel);
          break;

        // G — toggle follow mode
        case "g":
        case "G":
          if (state.selectedId) {
            state.setFollowMode(!state.followMode);
          }
          break;

        // S — toggle left panel (satellite list)
        case "s":
        case "S":
          state.setLeftPanelOpen(!state.leftPanelOpen);
          break;

        // F — toggle fullscreen
        case "f":
        case "F":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          break;

        // Arrow right — skip forward 5 min
        case "ArrowRight":
          e.preventDefault();
          state.setTimeOffset(state.timeOffset + 5 * 60 * 1000);
          break;

        // Arrow left — skip back 5 min
        case "ArrowLeft":
          e.preventDefault();
          state.setTimeOffset(state.timeOffset - 5 * 60 * 1000);
          break;

        // + or = — zoom in (speed up sim)
        case "+":
        case "=":
          {
            const speeds = [1, 2, 5, 10, 30, 60];
            const idx = speeds.indexOf(state.simSpeed);
            if (idx < speeds.length - 1) {
              state.setSimSpeed(speeds[idx + 1]);
              if (state.paused) state.setPaused(false);
            }
          }
          break;

        // - — slow down sim
        case "-":
          {
            const speeds = [1, 2, 5, 10, 30, 60];
            const idx = speeds.indexOf(state.simSpeed);
            if (idx > 0) {
              state.setSimSpeed(speeds[idx - 1]);
            }
          }
          break;

        // D — toggle stats dashboard
        case "d":
        case "D":
          state.setShowStats(!state.showStats);
          break;

        // R — toggle launches panel
        case "r":
        case "R":
          state.setShowLaunches(!state.showLaunches);
          break;


        // ? — show shortcuts help
        case "?":
          // Toggle a brief notification (we'll keep it simple)
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
