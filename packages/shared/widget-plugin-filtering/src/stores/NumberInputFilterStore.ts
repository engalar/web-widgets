import { Big } from "big.js";
import { ListAttributeValue, NumberFormatter } from "mendix";
import { action, makeObservable, comparer } from "mobx";
import { NumberArgument } from "./Argument";
import { BaseInputFilterStore } from "./BaseInputFilterStore";
import { FilterFunctionBinary, FilterFunctionGeneric, FilterFunctionNonValue } from "../typings/FilterFunctions";
import { Number_InputFilterInterface } from "../typings/InputFilterInterface";
import { FilterData, InputData } from "../typings/settings";
import { FilterCondition } from "mendix/filters";
import { inputStateFromCond } from "../condition-utils";
import { baseNames } from "./fn-mappers";

type NumFns = FilterFunctionGeneric | FilterFunctionNonValue | FilterFunctionBinary;
export class NumberInputFilterStore
    extends BaseInputFilterStore<NumberArgument, NumFns>
    implements Number_InputFilterInterface
{
    readonly storeType = "input";
    readonly type = "number";

    constructor(attributes: Array<ListAttributeValue<Big>>, initCond: FilterCondition | null) {
        const { formatter } = attributes[0];
        super(new NumberArgument(formatter), new NumberArgument(formatter), "equal", attributes);
        makeObservable(this, {
            updateProps: action,
            fromJSON: action,
            fromViewState: action
        });

        if (initCond) {
            this.fromViewState(initCond);
        }
    }

    updateProps(attributes: ListAttributeValue[]): void {
        if (!comparer.shallow(this._attributes, attributes)) {
            this._attributes = attributes;
        }
        const formatter = attributes.at(0)?.formatter;
        this.arg1.updateProps(formatter as NumberFormatter);
        this.arg2.updateProps(formatter as NumberFormatter);
    }

    toJSON(): InputData {
        return [
            this.filterFunction,
            this.arg1.value ? this.arg1.value.toJSON() : null,
            this.arg2.value ? this.arg2.value.toJSON() : null
        ];
    }

    fromJSON(data: FilterData): void {
        const inputData = this.unpackJsonData(data);
        if (!inputData) {
            return;
        }

        const [fn, val1, val2] = inputData;
        this.filterFunction = fn;
        try {
            this.arg1.value = new Big(val1 ?? "");
        } catch {
            this.arg1.value = undefined;
        }
        try {
            this.arg2.value = new Big(val2 ?? "");
        } catch {
            this.arg2.value = undefined;
        }
        this.isInitialized = true;
    }

    fromViewState(cond: FilterCondition): void {
        const initState = inputStateFromCond(
            cond,
            (fn): NumFns => baseNames(fn),
            exp => (exp.valueType === "Numeric" ? exp.value : undefined)
        );

        if (!initState) {
            return;
        }

        this.setState(initState);
        this.isInitialized = true;
    }
}
