import { observer } from "mobx-react-lite";
import { useEditableFilterController } from "@mendix/widget-plugin-filtering/helpers/useEditableFilterController";
import { useBasicSync } from "@mendix/widget-plugin-filtering/helpers/useBasicSync";
import { FilterFnList, InputWithFilters } from "@mendix/widget-plugin-filtering/controls";
import { generateUUID } from "@mendix/widget-plugin-platform/framework/generate-uuid";
import { createElement, useRef } from "react";
import { DatagridNumberFilterContainerProps, DefaultFilterEnum } from "../../typings/DatagridNumberFilterProps";
import { Number_InputFilterInterface } from "@mendix/widget-plugin-filtering/typings/InputFilterInterface";

const filterDefs: Record<DefaultFilterEnum, string> = {
    greater: "Greater than",
    greaterEqual: "Greater than or equal",
    equal: "Equal",
    notEqual: "Not equal",
    smaller: "Smaller than",
    smallerEqual: "Smaller than or equal",
    empty: "Empty",
    notEmpty: "Not empty"
};

const filters: FilterFnList<DefaultFilterEnum> = Object.entries(filterDefs).map(
    ([value, label]: [DefaultFilterEnum, string]) => ({
        value,
        label
    })
);

export interface ContainerProps extends DatagridNumberFilterContainerProps {
    filterStore: Number_InputFilterInterface;
    parentChannelName: string | null;
}

function Container(props: ContainerProps): React.ReactElement {
    const id = (useRef<string>().current ??= `NumberFilter${generateUUID()}`);

    const controller = useEditableFilterController({
        filter: props.filterStore,
        changeDelay: props.delay,
        defaultFilter: props.defaultFilter,
        defaultValue: props.defaultValue?.value,
        disableInputs: fn => fn === "empty" || fn === "notEmpty"
    });

    useBasicSync(props, props.filterStore);

    return (
        <InputWithFilters
            adjustable={props.adjustable}
            className={props.class}
            disableInputs={controller.disableInputs}
            filterFn={controller.selectedFn}
            filterFnList={filters}
            id={id}
            inputRef={controller.inputRef}
            inputStores={controller.inputs}
            name={props.name}
            onFilterChange={controller.handleFilterFnChange}
            placeholder={props.placeholder?.value}
            screenReaderButtonCaption={props.screenReaderButtonCaption?.value}
            screenReaderInputCaption={props.screenReaderInputCaption?.value}
            styles={props.style}
            tabIndex={props.tabIndex}
            type="number"
        />
    );
}

export const NumberFilterContainer = observer(Container);