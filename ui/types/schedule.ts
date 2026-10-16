export type PeriodState =
  | "success"
  | "warning"
  | "error"
  | "running"
  | "waiting"
  | "cancelled";

export type ScheduleEntry = {
  title: string;
  hostname: string;
  cron: string;
  timezone: string | null;
  timezoneInvalid: boolean;
  openPeriod: {
    start: string;
    end: string;
    state: PeriodState;
  };
  nextFires: Array<string>;
};

export type UnreadableScript = {
  title: string;
  hostname: string;
  message: string;
};

export type ScheduleResponse = {
  generatedAt: string;
  entries: Array<ScheduleEntry>;
  unreadable: Array<UnreadableScript>;
};
