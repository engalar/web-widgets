import { ColumnsStore } from "./ColumnsStore";
import { DatagridContainerProps } from "../../../typings/DatagridProps";
import { HeaderFiltersStore } from "./HeaderFiltersStore";
import { FilterCondition } from "mendix/filters";
import { SortInstruction } from "../../typings/GridModel";
import { GridSettingsStore } from "./GridSettingsStore";

export class RootGridStore {
    columnsStore: ColumnsStore;
    headerFiltersStore: HeaderFiltersStore;
    settingsStore: GridSettingsStore;

    constructor(props: DatagridContainerProps) {
        this.columnsStore = new ColumnsStore(props);
        this.headerFiltersStore = new HeaderFiltersStore(props);
        this.settingsStore = new GridSettingsStore(props, this.columnsStore);
    }

    updateProps(props: DatagridContainerProps): void {
        this.columnsStore.updateProps(props.columns);
    }

    get isLoaded(): boolean {
        return this.columnsStore.loaded;
    }

    get filterConditions(): FilterCondition[] | undefined {
        if (!this.headerFiltersStore.isDirty) {
            return undefined;
        }

        return this.columnsStore.filterConditions
            .filter((filter): filter is FilterCondition => filter !== undefined)
            .concat(this.headerFiltersStore.filterConditions);
    }

    get sortInstructions(): SortInstruction[] | undefined {
        return this.columnsStore.sortInstructions;
    }
}