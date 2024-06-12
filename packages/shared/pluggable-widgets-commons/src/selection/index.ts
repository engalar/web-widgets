import type {
    ActionValue,
    ListValue,
    ObjectItem,
    SelectionSingleValue,
    SelectionMultiValue,
    ListActionValue
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
    mergeSelectedItems: Map<string, ObjectItem> = new Map();
    previousSelectableItems: ObjectItem[] = [];
    constructor(
        private selectionValue: SelectionMultiValue,
        private selectableItems: ObjectItem[],
        private onDoSelect: ListActionValue | undefined,
        private onUnSelect: ListActionValue | undefined,
        private batch?: number
    ) {
        if ((onDoSelect === undefined) !== (onUnSelect === undefined)) {
            throw new Error("onDoSelect and onUnSelect must be both defined or both undefined");
        }
    }

    isSelected(value: ObjectItem): boolean {
        return this.selectionValue.selection.some(obj => obj.id === value.id);
    }

    updateProps(value: SelectionMultiValue, items: ObjectItem[], batch?: number): void {
        this.selectionValue = value;
        this.selectableItems = items;

        if (this.batch !== batch) {
            this.mergeSelectedItems.clear();
            this.selectNone();
            this.batch = batch;
            return;
        }
        // is items different from previous selectable items? by length and content?
        if (
            this.previousSelectableItems.length !== this.selectableItems.length ||
            this.previousSelectableItems.some(item => !this.selectableItems.some(obj => obj.id === item.id))
        ) {
            // page changed, restore selection, by selectableItems intersection with mergeSelectedItems
            this.selectionValue.setSelection(this.selectableItems.filter(item => this.mergeSelectedItems.has(item.id)));
            this.previousSelectableItems = this.selectableItems;
        }
    }

    get selectionStatus(): MultiSelectionStatus {
        return this.selectionValue.selection.length === 0
            ? "none"
            : this.selectionValue.selection.length === this.selectableItems.length
            ? "all"
            : "some";
    }

    add(value: ObjectItem): void {
        if (!this.isSelected(value)) {
            this.mergeSelectedItems.set(value.id, value);
            this.selectionValue.setSelection(this.selectionValue.selection.concat(value));
            this.onDoSelect?.get(value).execute();
        }
    }

    remove(value: ObjectItem): void {
        if (this.isSelected(value)) {
            this.mergeSelectedItems.delete(value.id);
            this.selectionValue.setSelection(this.selectionValue.selection.filter(obj => obj.id !== value.id));
            this.onUnSelect?.get(value).execute();
        }
    }

    selectAll(): void {
        this.selectionValue.setSelection(this.selectableItems);
    }
    selectNone(): void {
        this.selectionValue.setSelection([]);
    }
}

export function useSelectionHelper(
    selection: SelectionSingleValue | SelectionMultiValue | undefined,
    dataSource: ListValue,
    onSelectionChange: ActionValue | undefined,
    onDoSelect: ListActionValue | undefined,
    onUnSelect: ListActionValue | undefined,
    batch?: number
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
                    dataSource.items ?? [],
                    onDoSelect,
                    onUnSelect,
                    batch
                );
            } else {
                (selectionHelper.current as MultiSelectionHelper).updateProps(selection, dataSource.items ?? [], batch);
            }
        }
    }

    return selectionHelper.current;
}

export type { SingleSelectionHelper };
export type { MultiSelectionHelper };
export type SelectionHelper = SingleSelectionHelper | MultiSelectionHelper;
export type MultiSelectionStatus = "none" | "all" | "some";
