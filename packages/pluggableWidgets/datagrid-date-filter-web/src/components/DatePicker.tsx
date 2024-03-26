import { createElement, Dispatch, Fragment, ReactElement, SetStateAction } from "react";
import classNames from "classnames";
import replaceAllInserter from "string.prototype.replaceall";

import locale from "antd/es/date-picker/locale/zh_CN";

import { DatePicker as AntDatePicker } from "antd";

import "antd/es/date-picker/style/css";
import moment from "moment";
import "moment/locale/zh-cn";

moment.locale("zh-cn");

export type RangeDateValue = [Date | undefined, Date | undefined];

interface DatePickerProps {
    adjustable: boolean;
    dateFormat?: string;
    disabledInput?: boolean;
    enableRange?: boolean;
    locale?: string;
    id?: string;
    placeholder?: string;
    setRangeValues?: Dispatch<SetStateAction<RangeDateValue>>;
    rangeValues?: RangeDateValue;
    screenReaderCalendarCaption?: string;
    screenReaderInputCaption?: string;
    setValue: Dispatch<SetStateAction<Date | undefined>>;
    value?: Date;
    calendarStartDay?: number;
}

replaceAllInserter.shim();

export const DatePicker = (props: DatePickerProps): ReactElement => {
    return (
        <Fragment>
            <span className="sr-only" id={`${props.id}-label`}>
                {props.screenReaderInputCaption}
            </span>
            {props.enableRange ? (
                <AntDatePicker.RangePicker
                    onChange={dates => {
                        if (dates) {
                            props.setRangeValues?.([dates[0]?.toDate(), dates[1]?.toDate()]);
                        } else {
                            props.setRangeValues?.([undefined, undefined]);
                        }
                    }}
                    aria-labelledby={`${props.id}-label`}
                    autoFocus={false}
                    allowClear
                    format={["M/D/yyyy", "M/D/yyyy"]}
                    value={
                        props.rangeValues
                            ? [
                                  props.rangeValues[0] ? moment(props.rangeValues[0]) : null,
                                  props.rangeValues[1] ? moment(props.rangeValues[1]) : null
                              ]
                            : undefined
                    }
                    disabled={props.disabledInput ?? false}
                    className={classNames("form-control", { "filter-input": props.adjustable })}
                    locale={locale}
                />
            ) : (
                <AntDatePicker
                    allowClear
                    onChange={date => {
                        props.setValue(date?.toDate());
                    }}
                    aria-labelledby={`${props.id}-label`}
                    autoFocus={false}
                    format={"M/D/yyyy"}
                    value={props.value ? moment(props.value) : undefined}
                    disabled={props.disabledInput ?? false}
                    className={classNames("form-control", { "filter-input": props.adjustable })}
                    locale={locale}
                />
            )}
        </Fragment>
    );
};
