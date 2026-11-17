import type { Presenter } from "../../src/index.js";
import {
  Roll,
  RollSettings,
  Roller,
  EngineRegistry,
  engines,
  roll as rollOnce,
} from "../../src/index.js";
import type {
  EngineDefinition,
  EngineOption,
  RandomEngine,
  RollInputData,
  EncodedHistoryData,
  EncodedRollData,
  RollData,
} from "../../src/index.js";
import { accepts, assertType } from "./helpers.js";
import type { Equals } from "./helpers.js";

declare const html: Presenter<HTMLElement>;
declare const roll: Roll;
const randomEngine: RandomEngine = { next: () => 0 };
const engineDefinition: EngineDefinition = { name: "mersenne", seed: 42 };
const rollData: RollInputData = { character: { score: 18, proficient: true } };
accepts<EngineOption>(randomEngine);
accepts<EngineOption>(engineDefinition);
accepts<RollInputData>(rollData);

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
accepts<EncodedHistoryData>(htmlRoller.export("object"));
accepts<string>(htmlRoller.export("base64"));
accepts<string>(htmlRoller.export());
accepts<EncodedRollData>(roll.export("object"));
accepts<EncodedRollData>(roll.toJSON());
// @ts-expect-error - JSON is a string, not data
accepts<EncodedRollData>(roll.export("json"));
// @ts-expect-error - encoded numbers may be tags, not numbers
accepts<RollData>(roll.export("object"));
// @ts-expect-error - unknown export format
htmlRoller.export("xml");

// a roller with any presenter can restore dice on import, from encoded or plain data
Roll.fromJSON({} as EncodedRollData, htmlRoller.settings);
Roll.fromJSON({} as RollData, htmlRoller.settings);
htmlRoller.import(roll.export("object"));
htmlRoller.import(htmlRoller.export("object"));

// standalone rolls take roll options or shared settings, but no presenter
accepts<Roll>(new Roll("4d6"));
accepts<Roll>(new Roll("4d6", { engine: engines.nativeMath }));
accepts<Roll>(new Roll("$character.score", { data: rollData }));
accepts<Roll>(new Roll("4d6", new RollSettings()));
accepts<Roll>(
  new Roll("$character.score", new RollSettings({ data: rollData })),
);
accepts<Roll>(rollOnce("4d6", { limits: { maxQty: 10 } }));
accepts<Roll<HTMLElement>>(new Roll("4d6", { presenter: html }));
accepts<Roll>(roll.reroll());
const engineRegistry = new EngineRegistry();
const overrideRoller = new Roller({
  engines: engineRegistry,
  engine: "mersenne",
});
accepts<Roll>(overrideRoller.roll("d6", { engine: engineDefinition }));
accepts<Roll>(overrideRoller.roll("$character.score", { data: rollData }));
accepts<Roll>(roll.reroll({ engine: randomEngine }));
accepts<Roll>(roll.reroll({ engine: randomEngine, data: rollData }));
// @ts-expect-error - engine names, instances, or definitions are required
new Roller({ engine: 42 });
accepts<Roll>(Roll.import(""));
