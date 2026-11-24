import type { Presenter } from "../../src/index.js";
import { encode } from "../../src/serialization/index.js";
import type { ExportFormat } from "../../src/serialization/index.js";
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
declare const rawRollData: RollData;
declare const exportFormat: ExportFormat;
const randomEngine: RandomEngine = { next: () => 0 };
const engineDefinition: EngineDefinition = { name: "mersenne", seed: 42 };
const rollData: RollInputData = { character: { score: 18, proficient: true } };
accepts<EngineOption>(randomEngine);
accepts<EngineOption>(engineDefinition);
accepts<RollInputData>(rollData);

const encodedByDefault = encode(rawRollData);
assertType<Equals<typeof encodedByDefault, EncodedRollData>>();
accepts<EncodedRollData>(encodedByDefault);
const encodedWithUndefined = encode(rawRollData, undefined);
assertType<Equals<typeof encodedWithUndefined, EncodedRollData>>();
accepts<EncodedRollData>(encodedWithUndefined);
const encodedWithObject = encode(rawRollData, "object");
assertType<Equals<typeof encodedWithObject, EncodedRollData>>();
accepts<EncodedRollData>(encodedWithObject);
const encodedWithJson = encode(rawRollData, "json");
assertType<Equals<typeof encodedWithJson, string>>();
accepts<string>(encodedWithJson);
const encodedWithBase64 = encode(rawRollData, "base64");
assertType<Equals<typeof encodedWithBase64, string>>();
accepts<string>(encodedWithBase64);
const encodedWithAnyFormat = encode(rawRollData, exportFormat);
assertType<Equals<typeof encodedWithAnyFormat, EncodedRollData | string>>();
accepts<EncodedRollData | string>(encodedWithAnyFormat);

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
const defaultHistoryExport = htmlRoller.export();
assertType<Equals<typeof defaultHistoryExport, EncodedHistoryData>>();
accepts<EncodedHistoryData>(defaultHistoryExport);
const undefinedHistoryExport = htmlRoller.export(undefined);
assertType<Equals<typeof undefinedHistoryExport, EncodedHistoryData>>();
accepts<EncodedHistoryData>(undefinedHistoryExport);
const objectHistoryExport = htmlRoller.export("object");
assertType<Equals<typeof objectHistoryExport, EncodedHistoryData>>();
accepts<EncodedHistoryData>(objectHistoryExport);
const jsonHistoryExport = htmlRoller.export("json");
assertType<Equals<typeof jsonHistoryExport, string>>();
accepts<string>(jsonHistoryExport);
const base64HistoryExport = htmlRoller.export("base64");
assertType<Equals<typeof base64HistoryExport, string>>();
accepts<string>(base64HistoryExport);
const anyFormatHistoryExport = htmlRoller.export(exportFormat);
assertType<
  Equals<typeof anyFormatHistoryExport, EncodedHistoryData | string>
>();
accepts<EncodedHistoryData | string>(anyFormatHistoryExport);
const defaultRollExport = roll.export();
assertType<Equals<typeof defaultRollExport, EncodedRollData>>();
accepts<EncodedRollData>(defaultRollExport);
const undefinedRollExport = roll.export(undefined);
assertType<Equals<typeof undefinedRollExport, EncodedRollData>>();
accepts<EncodedRollData>(undefinedRollExport);
const objectRollExport = roll.export("object");
assertType<Equals<typeof objectRollExport, EncodedRollData>>();
accepts<EncodedRollData>(objectRollExport);
const jsonRollExport = roll.export("json");
assertType<Equals<typeof jsonRollExport, string>>();
accepts<string>(jsonRollExport);
const base64RollExport = roll.export("base64");
assertType<Equals<typeof base64RollExport, string>>();
accepts<string>(base64RollExport);
const anyFormatRollExport = roll.export(exportFormat);
assertType<Equals<typeof anyFormatRollExport, EncodedRollData | string>>();
accepts<EncodedRollData | string>(anyFormatRollExport);
accepts<EncodedRollData>(roll.toJSON());
// @ts-expect-error - JSON is a string, not data
accepts<EncodedRollData>(roll.export("json"));
// @ts-expect-error - encoded numbers may be tags, not numbers
accepts<RollData>(roll.export("object"));
// @ts-expect-error - unknown export format
htmlRoller.export("xml");
// @ts-expect-error - unknown export format
roll.export("xml");

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
