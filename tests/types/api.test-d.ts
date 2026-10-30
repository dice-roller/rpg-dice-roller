import type { Presenter } from "../../src/index.js";
import {
  Roll,
  RollSettings,
  Roller,
  engines,
  roll as rollOnce,
} from "../../src/index.js";
import type { HistoryData, RollData } from "../../src/index.js";
import { accepts, assertType } from "./helpers.js";
import type { Equals } from "./helpers.js";

declare const html: Presenter<HTMLElement>;
declare const roll: Roll;

// the roller's presenter decides the output type of `present()`
const textRoller = new Roller();
accepts<string>(textRoller.present());
const htmlRoller = new Roller({ presenter: html });
assertType<Equals<ReturnType<typeof htmlRoller.present<never>>, never>>();
accepts<HTMLElement>(htmlRoller.present());
// ...or a presenter given to the call
accepts<HTMLElement>(textRoller.present(html));

// `toString()` is always text
assertType<Equals<ReturnType<typeof htmlRoller.toString>, string>>();

// `present()` on a roll takes any presenter
accepts<HTMLElement>(roll.present(html));
accepts<string>(roll.present());

// export formats
accepts<HistoryData>(htmlRoller.export("object"));
accepts<string>(htmlRoller.export("base64"));
accepts<string>(htmlRoller.export());
accepts<RollData>(roll.export("object"));
// @ts-expect-error - JSON is a string, not data
accepts<RollData>(roll.export("json"));
// @ts-expect-error - unknown export format
htmlRoller.export("xml");

// a roller with any presenter can restore dice on import
Roll.fromJSON({} as RollData, htmlRoller.settings);

// standalone rolls take roll options or shared settings, but no presenter
accepts<Roll>(new Roll("4d6"));
accepts<Roll>(new Roll("4d6", { engine: engines.nativeMath }));
accepts<Roll>(new Roll("4d6", new RollSettings()));
accepts<Roll>(rollOnce("4d6", { limits: { maxQty: 10 } }));
accepts<Roll<HTMLElement>>(new Roll("4d6", { presenter: html }));
accepts<Roll>(roll.reroll());
accepts<Roll>(Roll.import(""));
