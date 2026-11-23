import { Roll, RollSettings, Roller, roll } from "../../src/index.js";
import type {
  DrawDieAsyncOptions,
  DrawDieSyncOptions,
  RollerOptions,
} from "../../src/index.js";
import { accepts, assertType } from "./helpers.js";
import type { Equals } from "./helpers.js";

const syncDrawDie: DrawDieSyncOptions = {
  drawMode: "sync",
  callback: () => 6,
};
const asyncDrawDie: DrawDieAsyncOptions = {
  drawMode: "async",
  /* eslint-disable @typescript-eslint/require-await */
  callback: async () => 6,
};

const syncRoll = Roll.create("d6", { drawDie: syncDrawDie });
const asyncRoll = Roll.create("d6", { drawDie: asyncDrawDie });
const syncShorthand = roll("d6", { drawDie: syncDrawDie });
const asyncShorthand = roll("d6", { drawDie: asyncDrawDie });

accepts<Roll>(syncRoll);
accepts<Roll>(syncShorthand);
assertType<Equals<typeof asyncRoll, Promise<Roll<string, "async">>>>();
assertType<Equals<typeof asyncShorthand, Promise<Roll<string, "async">>>>();

const syncRoller = new Roller({ drawDie: syncDrawDie });
const asyncRoller = new Roller({ drawDie: asyncDrawDie });
const syncRollerRoll = syncRoller.roll("d6");
const asyncRollerRoll = asyncRoller.roll("d6");
const asyncRollerDataRoll = asyncRoller.roll("d6", { data: { bonus: 2 } });
const asyncOverride = syncRoller.roll("d6", { drawDie: asyncDrawDie });
const syncOverride = asyncRoller.roll("d6", { drawDie: syncDrawDie });

void asyncShorthand;
void asyncRollerRoll;
void asyncRollerDataRoll;
void asyncOverride;

accepts<Roll>(syncRollerRoll);
assertType<Equals<typeof asyncRollerRoll, Promise<Roll<string, "async">>>>();
assertType<
  Equals<typeof asyncRollerDataRoll, Promise<Roll<string, "async">>>
>();
assertType<Equals<typeof asyncOverride, Promise<Roll<string, "async">>>>();
accepts<Roll>(syncOverride);

const broadlyTypedOptions: RollerOptions = {
  drawDie: Math.random() < 0.5 ? syncDrawDie : asyncDrawDie,
};
const broadlyTypedRoller = new Roller(broadlyTypedOptions);
const broadlyTypedRoll = broadlyTypedRoller.roll("d6");
const broadlyTypedDataRoll = broadlyTypedRoller.roll("d6", {
  data: { bonus: 2 },
});
const broadlyTypedAsyncOverride = broadlyTypedRoller.roll("d6", {
  drawDie: asyncDrawDie,
});
const broadlyTypedSyncOverride = broadlyTypedRoller.roll("d6", {
  drawDie: syncDrawDie,
});

const selectedMode =
  Math.random() < 0.5 ? ("sync" as const) : ("async" as const);
const dynamicallySelectedRoller = new Roller({
  drawDie: { drawMode: selectedMode, callback: () => 6 },
});
const dynamicallySelectedRoll = dynamicallySelectedRoller.roll("d6");

void broadlyTypedRoll;
void broadlyTypedDataRoll;
void broadlyTypedAsyncOverride;
void broadlyTypedSyncOverride;
void dynamicallySelectedRoll;

type RollWithUnknownMode =
  Roll<string, "sync"> | Promise<Roll<string, "async">>;
assertType<Equals<typeof broadlyTypedRoll, RollWithUnknownMode>>();
assertType<Equals<typeof broadlyTypedDataRoll, RollWithUnknownMode>>();
assertType<Equals<typeof dynamicallySelectedRoll, RollWithUnknownMode>>();
assertType<
  Equals<typeof broadlyTypedAsyncOverride, Promise<Roll<string, "async">>>
>();
assertType<Equals<typeof broadlyTypedSyncOverride, Roll<string, "sync">>>();

const rerollSync = syncRoll.reroll();
const rerollAsync = asyncRoll.then((completed) => completed.reroll());
void rerollAsync;
accepts<Roll>(rerollSync);
assertType<Equals<typeof rerollAsync, Promise<Roll<string, "async">>>>();

const defaultSettings = new RollSettings();
const inlineSettingsRoll = Roll.create("d6", new RollSettings());
const settingsRoll = Roll.create("d6", defaultSettings);
accepts<Roll>(inlineSettingsRoll);
accepts<Roll>(settingsRoll);

const asyncSettings = new RollSettings({ drawDie: asyncDrawDie });
const syncSettingsTypecheck: RollSettings<string, "sync"> = defaultSettings;
const asyncSettingsTypecheck: RollSettings<string, "async"> = asyncSettings;
const importedRoll = Roll.import(syncRollerRoll.export("object"), {
  drawDie: asyncDrawDie,
});
const importedRollFromJson = Roll.fromJSON(syncRollerRoll.export("object"), {
  drawDie: asyncDrawDie,
});
const importedSettingsRoll = Roll.import(
  syncRollerRoll.export("object"),
  asyncSettings,
);
const asyncImportedRolls = asyncRoller.import(syncRollerRoll.export("object"));
const importedRollReroll = importedRoll.reroll();
const importedRollFromJsonReroll = importedRollFromJson.reroll();
const importedSettingsReroll = importedSettingsRoll.reroll();
const asyncImportedReroll = asyncImportedRolls[0].reroll();
type AsyncImportedRoll = (typeof asyncImportedRolls)[number];

void syncSettingsTypecheck;
void asyncSettingsTypecheck;

assertType<Equals<typeof importedRoll, Roll<string, "async">>>();
accepts<Promise<Roll<string, "async">>>(importedRollReroll);
assertType<Equals<typeof importedRollFromJson, Roll<string, "async">>>();
accepts<Promise<Roll<string, "async">>>(importedRollFromJsonReroll);
assertType<Equals<typeof importedSettingsRoll, Roll<string, "async">>>();
accepts<Promise<Roll<string, "async">>>(importedSettingsReroll);
assertType<Equals<AsyncImportedRoll, Roll<string, "async">>>();
accepts<Promise<Roll<string, "async">>>(asyncImportedReroll);
