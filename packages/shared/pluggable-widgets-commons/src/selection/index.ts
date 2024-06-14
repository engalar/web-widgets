import Big from "big.js";
import {
    type ActionValue,
    type ListValue,
    type ObjectItem,
    type SelectionSingleValue,
    type SelectionMultiValue,
    type EditableValue,
    ValueStatus
} from "mendix";
import { useEffect, useRef } from "react";

class SingleSelectionHelper {
    type = "Single" as const;
    constructor(private selectionValue: SelectionSingleValue) {}

    updateProps(value: SelectionSingleValue): void {
        this.selectionValue = value;
    }

    isSelected(value: ObjectItem): boolean {
        return this.selectionValue.selection?.id === value.id;
    }
    add(value: ObjectItem): void {
        this.selectionValue.setSelection(value);
    }
    remove(_value: ObjectItem): void {
        this.selectionValue.setSelection(undefined);
    }
}

class MultiSelectionHelper {
    type = "Multi" as const;
    /**local cache */
    mergeSelectedItems: Map<string, ObjectItem> = new Map();
    constructor(
        private selectionValue: SelectionMultiValue,
        private onSelectionChange: ActionValue | undefined,
        private selectableItems: ObjectItem[],
        private newTrialSwitch: boolean,
        private historyVersion?: EditableValue<Big>
    ) {}

    isSelected(value: ObjectItem): boolean {
        return this.newTrialSwitch
            ? this.mergeSelectedItems.has(value.id)
            : this.selectionValue.selection.some(obj => obj.id === value.id);
    }

    updateProps(value: SelectionMultiValue, items: ObjectItem[], historyVersion?: EditableValue<Big>): void {
        this.selectionValue = value;
        this.selectableItems = items;
        this.historyVersion = historyVersion;

        if (this.newTrialSwitch) {
            // when enable new trial and historyVersion is 0, clear cross-page selection
            if (this.historyVersion!.status === ValueStatus.Available && this.historyVersion!.value?.toNumber() === 0) {
                this.mergeSelectedItems.clear();
                this.selectNone();
            }
            return;
        }
    }

    get selectionStatus(): MultiSelectionStatus {
        if (this.newTrialSwitch) {
            // if selectableItems no one in mergeSelectedItems, return none
            if (this.selectableItems.every(item => !this.mergeSelectedItems.has(item.id))) {
                return "none";
            }
            // if selectableItems all in mergeSelectedItems, return all
            if (this.selectableItems.every(item => this.mergeSelectedItems.has(item.id))) {
                return "all";
            }
            // if selectableItems some in mergeSelectedItems, return some
            return "some";
        }
        return this.selectionValue.selection.length === 0
            ? "none"
            : this.selectionValue.selection.length === this.selectableItems.length
            ? "all"
            : "some";
    }

    add(value: ObjectItem): void {
        if (this.newTrialSwitch) {
            this.mergeSelectedItems.set(value.id, value);
            // if value less 0 then 0
            let oldVerion = this.historyVersion!.value?.toNumber() || 0;
            oldVerion = oldVerion < 0 ? 0 : oldVerion;
            // notify selection change
            this.historyVersion!.setValue(Big(oldVerion + 1));
            this._ensureSelection([value]);
            return;
        }
        if (!this.isSelected(value)) {
            this.selectionValue.setSelection(this.selectionValue.selection.concat(value));
        }
    }

    remove(value: ObjectItem): void {
        if (this.newTrialSwitch) {
            this.mergeSelectedItems.delete(value.id);
            // if value less 0 then 0
            let oldVerion = this.historyVersion!.value?.toNumber() || 0;
            oldVerion = oldVerion > 0 ? 0 : oldVerion;
            // notify selection change
            this.historyVersion!.setValue(Big(oldVerion - 1));
            this._ensureSelection([value]);
            return;
        }
        if (this.isSelected(value)) {
            this.selectionValue.setSelection(this.selectionValue.selection.filter(obj => obj.id !== value.id));
        }
    }

    selectAll(): void {
        if (this.newTrialSwitch) {
            // cross-page selection add page items
            this.selectableItems.forEach(item => {
                this.mergeSelectedItems.set(item.id, item);
            });
            // if value less 0 then 0
            let oldVerion = this.historyVersion!.value?.toNumber() || 0;
            oldVerion = oldVerion < 0 ? 0 : oldVerion;
            // notify selection change
            this.historyVersion!.setValue(Big(oldVerion + 1));
            this._ensureSelection(this.selectableItems);
            return;
        }
        this.selectionValue.setSelection(this.selectableItems);
    }
    selectNone(): void {
        if (this.newTrialSwitch) {
            // reset page selection
            this.selectableItems.forEach(item => {
                this.mergeSelectedItems.delete(item.id);
            });
            // if value less 0 then 0
            let oldVerion = this.historyVersion!.value?.toNumber() || 0;
            oldVerion = oldVerion > 0 ? 0 : oldVerion;
            // notify selection change
            this.historyVersion!.setValue(Big(oldVerion - 1));
            this._ensureSelection(this.selectableItems);
            return;
        }
        this.selectionValue.setSelection([]);
    }
    _ensureSelection(value: ObjectItem[]): void {
        const oldSelection = this.selectionValue.selection;
        this.selectionValue.setSelection(value);
        // if selectableItems all in value, return true
        if (oldSelection.every(item => value.some(obj => obj.id === item.id))) {
            this.onSelectionChange?.execute();
            return;
        }
    }
}

export function useSelectionHelper(
    selection: SelectionSingleValue | SelectionMultiValue | undefined,
    dataSource: ListValue,
    onSelectionChange: ActionValue | undefined,
    newTrialSwitch: boolean,
    historyVersion?: EditableValue<Big>
): SelectionHelper | undefined {
    const firstLoadDone = useRef(false);
    useEffect(() => {
        if (firstLoadDone.current) {
            onSelectionChange?.execute();
        }
    }, [selection?.selection]);
    useEffect(() => {
        if (dataSource?.status !== "loading") {
            firstLoadDone.current = true;
        }
    }, [dataSource?.status]);

    const selectionHelper = useRef<SelectionHelper | undefined>(undefined);

    if (selection !== undefined) {
        if (selection.type === "Single") {
            if (!selectionHelper.current) {
                selectionHelper.current = new SingleSelectionHelper(selection);
            } else {
                (selectionHelper.current as SingleSelectionHelper).updateProps(selection);
            }
        } else {
            if (!selectionHelper.current) {
                selectionHelper.current = new MultiSelectionHelper(
                    selection,
                    onSelectionChange,
                    dataSource.items ?? [],
                    newTrialSwitch,
                    historyVersion
                );
            } else {
                (selectionHelper.current as MultiSelectionHelper).updateProps(
                    selection,
                    dataSource.items ?? [],
                    historyVersion
                );
            }
        }
    }

    return selectionHelper.current;
}

export type { SingleSelectionHelper };
export type { MultiSelectionHelper };
export type SelectionHelper = SingleSelectionHelper | MultiSelectionHelper;
export type MultiSelectionStatus = "none" | "all" | "some";
