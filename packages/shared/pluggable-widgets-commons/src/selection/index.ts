import type { ActionValue, ListValue, ObjectItem, SelectionSingleValue, SelectionMultiValue } from "mendix";
import { useCallback, useEffect, useRef, useState } from "react";

class SingleSelectionHelper {
    type = "Single" as const;
    constructor(public selectionValue: SelectionSingleValue) {}

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
    reset(): void {
        this.selectionValue.setSelection(undefined);
    }
}

class MultiSelectionHelper {
    type = "Multi" as const;
    constructor(public selectionValue: SelectionMultiValue, public selectableItems: ObjectItem[]) {}

    isSelected(value: ObjectItem): boolean {
        return this.selectionValue.selection.some(obj => obj.id === value.id);
    }

    updateProps(value: SelectionMultiValue, items: ObjectItem[]): void {
        this.selectionValue = value;
        this.selectableItems = items;
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
            this.selectionValue.setSelection(this.selectionValue.selection.concat(value));
        }
    }

    remove(value: ObjectItem): void {
        if (this.isSelected(value)) {
            this.selectionValue.setSelection(this.selectionValue.selection.filter(obj => obj.id !== value.id));
        }
    }

    selectAll(): void {
        this.selectionValue.setSelection(this.selectableItems);
    }
    selectNone(): void {
        this.selectionValue.setSelection([]);
    }
    reset(): void {
        this.selectionValue.setSelection([]);
    }
}

export function useSelectionHelper(
    selection: SelectionSingleValue | SelectionMultiValue | undefined,
    dataSource: ListValue,
    onSelectionChange: ActionValue | undefined
): { selectionHelper: SelectionHelper | undefined; reset: () => void; selectCount: number } | undefined {
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
    // use selectCount
    const [selectCount, setSelectCount] = useState(0);

    useEffect(() => {
        if (selection !== undefined) {
            if (selection.type === "Single") {
                if (!selectionHelper.current) {
                    selectionHelper.current = new SingleSelectionHelper(selection);
                } else {
                    (selectionHelper.current as SingleSelectionHelper).updateProps(selection);
                }
            } else {
                if (!selectionHelper.current) {
                    selectionHelper.current = new MultiSelectionHelper(selection, dataSource.items ?? []);
                } else {
                    const preSelection = (selectionHelper.current as MultiSelectionHelper).selectionValue;

                    // switch page lead to selction reset, so need to restore the pre selection into new selection. But change selection will run into dead loop
                    if (preSelection.selection.length > 0 && selection.selection.length === 0) {
                        // Fixme: Maybe due to the mendix client api limitation, we can't select a item which not in the current page.
                        selection.setSelection(preSelection.selection);
                    }
                    (selectionHelper.current as MultiSelectionHelper).updateProps(
                        selection,
                        concatItems((selectionHelper.current as MultiSelectionHelper).selectableItems, dataSource.items)
                    );
                    setSelectCount(selection.selection.length);
                }
            }
        }
    }, [selection, dataSource?.items]);

    const reset = useCallback(() => {
        if (selectionHelper.current) {
            if (selectionHelper.current instanceof SingleSelectionHelper) {
                selectionHelper.current.reset();
            } else if (selectionHelper.current instanceof MultiSelectionHelper) {
                selectionHelper.current.reset();
            }
        }
    }, []);

    return { selectionHelper: selectionHelper.current, reset, selectCount };
}

export type { SingleSelectionHelper };
export type { MultiSelectionHelper };
export type SelectionHelper = SingleSelectionHelper | MultiSelectionHelper;
export type MultiSelectionStatus = "none" | "all" | "some";
function concatItems(preItems: ObjectItem[] | undefined, items: ObjectItem[] | undefined): ObjectItem[] {
    if (preItems && items) {
        const mergedItems = preItems.concat(items);
        const mergedMap = mergedItems.reduce((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
        }, {} as { [key: string]: ObjectItem });
        return Object.values(mergedMap);
    }
    return preItems || items || [];
}
