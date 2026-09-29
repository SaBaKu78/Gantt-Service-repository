export type Window = {
  start: Date
  end: Date
}

export function assertValidWindow(window: Window): void {
  if (window.start >= window.end) {
    throw new Error('windowStartTime must be earlier than windowEndTime')
  }
}

export function isTimeOverlapping(
  start: Date,
  end: Date,
  window: Window,
): boolean {
  return start < window.end && end > window.start
}

export function isCoveredByShift(
  taskStart: Date,
  taskEnd: Date,
  shiftStart: Date,
  shiftEnd: Date,
): boolean {
  return taskStart >= shiftStart && taskEnd <= shiftEnd
}

export function isActiveAssignment(status: string, deleted: boolean): boolean {
  return !deleted && !['RELEASED', 'CANCELLED'].includes(status)
}

export function clipToWindow(
  start: Date,
  end: Date,
  window: Window,
): { start: Date; end: Date } {
  return {
    start: start >= window.start ? start : window.start,
    end: end <= window.end ? end : window.end,
  }
}