import { renderSessionSchedule } from './session-schedule.js?v=2';
import { renderScreeningSchedule } from './screening-schedule.js?v=2';

// This module intentionally has no authentication or remote-service dependency.
const tick = () => {
  renderSessionSchedule(document);
  renderScreeningSchedule(document, undefined);
};
tick();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', tick);
