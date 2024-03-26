import { createElement, CSSProperties, ReactElement, useCallback, useEffect, useState } from "react";
import { FilterSelector } from "@mendix/pluggable-widgets-commons/components/web";

import { DefaultFilterEnum } from "../../typings/DatagridDateFilterProps";

import { DatePicker, RangeDateValue } from "./DatePicker";
import classNames from "classnames";

interface FilterComponentProps {
    adjustable: boolean;
    calendarStartDay?: number;
    className?: string;
    defaultFilter: DefaultFilterEnum;
    defaultValue?: Date;
    defaultStartDate?: Date;
    defaultEndDate?: Date;
    dateFormat?: string;
    locale?: string;
    id?: string;
    placeholder?: string;
    screenReaderButtonCaption?: string;
    screenReaderCalendarCaption?: string;
    screenReaderInputCaption?: string;
    tabIndex?: number;
    styles?: CSSProperties;
    updateFilters?: (value: Date | undefined, rangeValues: RangeDateValue, type: DefaultFilterEnum) => void;
}

export function FilterComponent(props: FilterComponentProps): ReactElement {
    const [type, setType] = useState<DefaultFilterEnum>(props.defaultFilter);
    const [value, setValue] = useState<Date | undefined>(props.defaultValue);
    const [rangeValues, setRangeValues] = useState<RangeDateValue>([props.defaultStartDate, props.defaultEndDate]);

    useEffect(() => {
        setValue(prev => {
            if (prev?.toISOString() === props.defaultValue?.toISOString()) {
                return prev;
            }

            return props.defaultValue;
        });
    }, [props.defaultValue]);

    useEffect(() => {
        if (props.defaultStartDate || props.defaultEndDate) {
            setRangeValues([props.defaultStartDate, props.defaultEndDate]);
        }
    }, [props.defaultStartDate, props.defaultEndDate]);

    useEffect(() => {
        props.updateFilters?.(value, rangeValues, type);
    }, [value, rangeValues, type]);

    return (
        <div
            className={classNames("filter-container", props.className)}
            data-focusindex={props.tabIndex ?? 0}
            style={props.styles}
        >
            {props.adjustable && (
                <FilterSelector
                    ariaLabel={props.screenReaderButtonCaption}
                    defaultFilter={props.defaultFilter}
                    id={props.id}
                    onChange={useCallback(type => {
                        setType(prev => {
                            if (prev === type) {
                                return prev;
                            }
                            return type;
                        });
                    }, [])}
                    options={
                        [
                            { value: "between", label: "介于之间" },
                            { value: "greater", label: "大于" },
                            { value: "greaterEqual", label: "大于或等于" },
                            { value: "equal", label: "等于" },
                            { value: "notEqual", label: "不等于" },
                            { value: "smaller", label: "小于" },
                            { value: "smallerEqual", label: "小于或等于" },
                            { value: "empty", label: "为空" },
                            { value: "notEmpty", label: "非空" }
                        ] as Array<{ value: DefaultFilterEnum; label: string }>
                    }
                />
            )}
            <DatePicker
                adjustable={props.adjustable}
                calendarStartDay={props.calendarStartDay}
                dateFormat={props.dateFormat}
                disabledInput={type === "empty" || type === "notEmpty"}
                enableRange={type === "between"}
                locale={props.locale}
                id={props.id}
                placeholder={props.placeholder}
                rangeValues={rangeValues}
                screenReaderCalendarCaption={props.screenReaderCalendarCaption}
                screenReaderInputCaption={props.screenReaderInputCaption}
                setRangeValues={setRangeValues}
                setValue={setValue}
                value={value}
            />
        </div>
    );
}
