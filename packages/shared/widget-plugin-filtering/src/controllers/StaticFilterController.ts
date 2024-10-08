import { ActionValue, DynamicValue } from "mendix";
import { makeObservable, computed, autorun, observable } from "mobx";
import { OptionListFilterInterface, Option } from "../typings/OptionListFilterInterface";

interface CustomOption<T> {
    caption: T;
    value: T;
}

interface Props {
    filterStore: OptionListFilterInterface;
    multiselect: boolean;
    defaultValue?: string;
    filterOptions: Array<CustomOption<DynamicValue<string>>>;
    onChange?: ActionValue;
    emptyCaption?: string;
}

export class StaticFilterController {
    private store: OptionListFilterInterface;
    _filterOptions: Array<CustomOption<DynamicValue<string>>>;
    readonly empty: Option;
    readonly defaults: string[] | undefined;
    multiselect = false;
    private onChange?: ActionValue;

    constructor(props: Props) {
        this.store = props.filterStore;
        this.multiselect = props.multiselect;
        this._filterOptions = props.filterOptions;
        this.empty = {
            value: "__EMPTY__",
            caption: props.emptyCaption ?? "",
            selected: false
        };
        this.defaults = props.defaultValue ? [props.defaultValue] : undefined;
        this.onChange = props.onChange;

        makeObservable(this, {
            inputValue: computed,
            _filterOptions: observable.struct,
            customOptions: computed
        });
    }

    get inputValue(): string {
        return this.store.options.flatMap(opt => (opt.selected ? [opt.caption] : [])).join(",");
    }

    get options(): Option[] {
        return [...this.store.options];
    }

    get customOptions(): Array<CustomOption<string>> {
        return this._filterOptions.map(opt => ({
            caption: `${opt.caption?.value}`,
            value: `${opt.value?.value}`
        }));
    }

    setup(): () => void {
        const disposers: Array<() => void> = [];

        this.store.UNSAFE_setDefaults(this.defaults);

        disposers.push(
            autorun(() => {
                if (this.customOptions.length > 0) {
                    this.store.setCustomOptions(this.customOptions);
                }
            })
        );

        return () => disposers.forEach(unsub => unsub());
    }

    updateProps(props: Props): void {
        this._filterOptions = props.filterOptions;
        this.onChange = props.onChange;
    }

    onSelect = (value: string): void => {
        if (value === this.empty.value) {
            this.store.replace([]);
        } else if (this.multiselect) {
            this.store.toggle(value);
        } else {
            this.store.replace([value]);
        }

        if (this.onChange?.canExecute) {
            this.onChange.execute();
        }
    };
}
