import EventEmiter from "events";

export const emitter = new EventEmiter();

const dnext = {
  on: (event: string, callback: (...args: any[]) => void) => {
    emitter.on(event, callback);
  },
  emit: (event: string, ...args: any[]) => {
    emitter.emit(event, ...args);
  },
};

export default dnext;
