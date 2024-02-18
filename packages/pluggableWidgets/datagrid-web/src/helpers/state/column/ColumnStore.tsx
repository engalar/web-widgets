import {
    DynamicValue,
    ListAttributeValue,
    ListExpressionValue,
    ListWidgetValue,
    ObjectItem,
    ValueStatus
} from "mendix";
import { createElement, ReactElement, ReactNode } from "react";
import { AlignmentEnum, ColumnsType } from "../../../../typings/DatagridProps";
import { ColumnId, GridColumn } from "../../../typings/GridColumn";
import { Big } from "big.js";
import { action, computed, makeObservable, observable } from "mobx";
import { ColumnsStore } from "../ColumnsStore";
import { ColumnFilterStore, IColumnFilterStore } from "./ColumnFilterStore";
import { BaseColumnInfo } from "./BaseColumnInfo";
import { FilterCondition } from "mendix/filters";

export interface IColumnStore extends GridColumn {
    filter: IColumnFilterStore;
}

export class ColumnStore implements IColumnStore {
    canDrag: boolean;
    columnNumber: number;

    filter: ColumnFilterStore;

    private headerElementRef: HTMLDivElement | null = null;

    private baseInfo: BaseColumnInfo;
    private columnsStore: ColumnsStore;

    // dynamic props from PW API
    private _visible?: DynamicValue<boolean> = undefined; // can't render when unavailable
    private _header?: DynamicValue<string> = undefined; // can render when unavailable
    private _columnClass?: ListExpressionValue<string> = undefined; // can render when unavailable
    private _tooltip?: ListExpressionValue<string> = undefined; // part of attribute or dynamicText
    private _attribute?: ListAttributeValue<string | Big | boolean | Date> = undefined; // as "attribute"
    private _dynamicText?: ListExpressionValue<string> = undefined; // as "dynamicText"
    private _content?: ListWidgetValue = undefined; // as "customContent"

    constructor(
        props: ColumnsType,
        columnNumber: number,
        columnsStore: ColumnsStore,
        initialFilters: FilterCondition | undefined
    ) {
        this.columnsStore = columnsStore;

        this.baseInfo = new BaseColumnInfo(props); // base props never change, it is safe to no update them
        this.filter = new ColumnFilterStore(props, initialFilters);

        this.columnNumber = columnNumber; // this number also never changes
        this.canDrag = this.baseInfo.draggable && this.columnsStore.dragEnabled;

        makeObservable<
            ColumnStore,
            "_visible" | "_header" | "_columnClass" | "_tooltip" | "_attribute" | "_dynamicText" | "_content"
        >(this, {
            _visible: observable,
            _header: observable.shallow,
            _columnClass: observable,
            _tooltip: observable,
            _attribute: observable,
            _dynamicText: observable,
            _content: observable,

            updateProps: action,

            canSort: computed,
            header: computed,
            loaded: computed
        });

        this.updateProps(props);
    }

    updateProps(props: ColumnsType): void {
        this._visible = props.visible;

        this._header = props.header;

        this._columnClass = props.columnClass;
        this._tooltip = props.tooltip;

        switch (this.baseInfo.showContentAs) {
            case "attribute": {
                this._attribute = props.attribute;
                break;
            }
            case "customContent": {
                this._content = props.content;
                break;
            }
            case "dynamicText": {
                this._dynamicText = props.dynamicText;
                break;
            }
        }

        this.filter.updateProps(props);
    }

    // old props
    get alignment(): AlignmentEnum {
        return this.baseInfo.alignment;
    }

    get initiallyHidden(): boolean {
        return this.baseInfo.initiallyHidden;
    }

    get wrapText(): boolean {
        return this.baseInfo.wrapText;
    }

    // hiding
    get canHide(): boolean {
        return this.baseInfo.hidable && this.columnsStore.hideEnabled;
    }
    get isHidden(): boolean {
        return this.columnsStore.visual.isHidden(this.columnId);
    }
    toggleHidden(): void {
        this.columnsStore.visual.toggleHidden(this.columnId);
    }

    // size
    get canResize(): boolean {
        // column is not resizable if it is at the end of the grid
        return this.baseInfo.resizable && this.columnsStore.resizeEnabled && !this.isLastVisible();
    }
    get size(): number | undefined {
        return this.columnsStore.visual.getSize(this.columnId);
    }
    setSize(size: number | undefined): void {
        this.columnsStore.visual.setSize(this.columnId, size);
    }

    // sorting
    get canSort(): boolean {
        return this.baseInfo.sortable && !!this._attribute?.sortable && this.columnsStore.sortEnabled;
    }
    get sortDir(): "asc" | "desc" | undefined {
        if (this.columnsStore.sorting.rule && this.columnsStore.sorting.rule.at(0) === this.columnId) {
            const [, dir] = this.columnsStore.sorting.rule;

            return dir;
        }

        return undefined;
    }
    toggleSort(): void {
        this.columnsStore.sorting.toggleSort(this.columnId);
    }

    get columnId(): ColumnId {
        return this.columnNumber.toString() as ColumnId;
    }

    get isAvailable(): boolean {
        return this._visible?.value ?? false;
    }

    get header(): string {
        return this._header?.value ?? "";
    }

    get status(): ValueStatus {
        return this._visible?.status ?? ValueStatus.Loading;
    }

    get loaded(): boolean {
        if (!this._visible) {
            console.warn(
                `Didn't expect column #${this.columnNumber} to not have "visible" expression. Treating as true (loaded)`
            );
            return true;
        }

        if (this._visible.status === ValueStatus.Loading && this._visible.value === undefined) {
            // if status is Loading and no previous value is available it means initial loading
            return false;
        }

        return true;
    }

    get attrId(): ListAttributeValue["id"] | undefined {
        return this._attribute?.id;
    }

    setHeaderElementRef(ref: HTMLDivElement | null): void {
        this.headerElementRef = ref;
    }

    takeSizeSnapshot(): void {
        const size = this.headerElementRef?.clientWidth;
        if (size) {
            this.setSize(size);
        }
    }

    renderCellContent(item: ObjectItem): ReactElement {
        switch (this.baseInfo.showContentAs) {
            case "attribute":
            case "dynamicText": {
                return (
                    <span className="td-text" title={this._tooltip?.get(item)?.value}>
                        {this.baseInfo.showContentAs === "attribute"
                            ? this._attribute?.get(item)?.displayValue
                            : this._dynamicText?.get(item)?.value}
                    </span>
                );
            }
            case "customContent": {
                return <CustomContent>{this._content?.get(item)}</CustomContent>;
            }
            default:
                throw new Error(`Unknown content type: ${this.baseInfo.showContentAs}`);
        }
    }

    columnClass(item: ObjectItem): string | undefined {
        return this._columnClass?.get(item).value;
    }

    private isLastVisible(): boolean {
        return this.columnsStore.visibleColumns.at(-1) === this;
    }

    getCssWidth(): string {
        if (this.size) {
            if (this.isLastVisible()) {
                return "minmax(min-content, auto)";
            }
            return `${this.size}px`;
        }
        return this.baseInfo.columnWidth;
    }
}

const stopPropagation = (event: { stopPropagation(): void }): void => {
    event.stopPropagation();
};

const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.code === "Tab") {
        return;
    }

    event.stopPropagation();
};

function CustomContent(props: { children: ReactNode }): ReactElement {
    return (
        <div onClick={stopPropagation} onKeyUp={stopPropagation} onKeyDown={onKeyDown} className="td-custom-content">
            {props.children}
        </div>
    );
}