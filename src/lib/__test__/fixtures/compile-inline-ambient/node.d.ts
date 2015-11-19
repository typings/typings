declare const require: (module: string) => any;

declare module "events" {
	export const test: boolean;
}

declare module "fs" {
	import * as events from "events";
}
