import { useState, useCallback, useEffect, useRef } from 'react';
import { OscillatorState } from '../types';

export const useUndoRedo = (
  currentOscillators: OscillatorState[],
  setAllOscillators: (oscillators: OscillatorState[]) => void
) => {
  const [past, setPast] = useState<OscillatorState[][]>([]);
  const [future, setFuture] = useState<OscillatorState[][]>([]);

  // Ref to prevent capturing programmatic updates triggered by undo/redo
  const isUndoRedoAction = useRef(false);

  // Push current state to past stack before modifying
  const pushState = useCallback((newOscillators: OscillatorState[]) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setPast(prevPast => {
      // Limit history to 50 steps
      const updated = [...prevPast, currentOscillators];
      if (updated.length > 50) updated.shift();
      return updated;
    });
    setFuture([]);
  }, [currentOscillators]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture(prevFuture => [currentOscillators, ...prevFuture]);
    setPast(newPast);

    isUndoRedoAction.current = true;
    setAllOscillators(previousState);
  }, [past, currentOscillators, setAllOscillators]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const nextState = future[0];
    const newFuture = future.slice(1);

    setPast(prevPast => [...prevPast, currentOscillators]);
    setFuture(newFuture);

    isUndoRedoAction.current = true;
    setAllOscillators(nextState);
  }, [future, currentOscillators, setAllOscillators]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    pushState,
    clearHistory,
    historyLength: past.length
  };
};
