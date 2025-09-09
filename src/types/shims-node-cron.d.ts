declare module "node-cron" {
	interface ScheduledTask {
		start(): void;
		stop(): void;
		destroy(): void;
		getStatus?(): string;
	}

	type ScheduleOptions = {
		scheduled?: boolean;
		recoverMissedExecutions?: boolean;
		timezone?: string;
	};

	export default function cron(expr: string, fn: () => void, options?: ScheduleOptions): ScheduledTask;

	export function schedule(expr: string, fn: () => void, options?: ScheduleOptions): ScheduledTask;
}
