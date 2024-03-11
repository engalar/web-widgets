import { DynamicValue, ListAttributeValue, ListWidgetValue } from "mendix";
import { ReactNode, createElement } from "react";
import {
    OptionsSourceAssociationCustomContentTypeEnum,
    OptionsSourceStaticDataSourceType
} from "../../../typings/ComboboxProps";
import { CaptionPlacement, CaptionsProvider } from "../types";
import { CaptionContent } from "../utils";

interface Props {
    emptyOptionText?: DynamicValue<string>;
    customContent?: ListWidgetValue | undefined;
    customContentType: OptionsSourceAssociationCustomContentTypeEnum;
    attribute?: ListAttributeValue<string | Big>;
    caption?: string;
}

export class StaticCaptionsProvider implements CaptionsProvider {
    private unavailableCaption = "<...>";
    protected customContent?: ListWidgetValue;
    protected customContentType: OptionsSourceAssociationCustomContentTypeEnum = "no";
    attribute?: ListAttributeValue<string | Big>;
    emptyCaption = "";
    overrideCaption: string | null | undefined = undefined;

    constructor(private optionsMap: Map<string, OptionsSourceStaticDataSourceType>) {}

    updateProps(props: Props): void {
        if (!props.emptyOptionText || props.emptyOptionText.status === "unavailable") {
            this.emptyCaption = "";
        } else {
            this.emptyCaption = props.emptyOptionText.value!;
        }

        this.customContent = props.customContent;
        this.customContentType = props.customContentType;
        this.attribute = props.attribute;
        this.overrideCaption = props.caption;
    }

    get(id: string | null): string {
        if (id === null) {
            if (this.overrideCaption) {
                return this.overrideCaption;
            }
            return this.emptyCaption;
        }

        const item = this.optionsMap.get(id);
        if (!item) {
            return this.unavailableCaption;
        }
        const captionValue = item.staticDataSourceCaption;
        if (!captionValue) {
            return this.unavailableCaption;
        }

        return captionValue;
    }

    getCustomContent(value: string | null): ReactNode | null {
        if (value === null) {
            return null;
        }
        const item = this.optionsMap.get(value);
        if (!item) {
            return null;
        }
    }

    render(index: number | null, placement: CaptionPlacement, htmlFor?: string): ReactNode {
        const { customContentType } = this;

        return customContentType === "no" ||
            (placement === "label" && customContentType === "listItem") ||
            index === null ? (
            <CaptionContent htmlFor={htmlFor}>{this.get(index?.toString() ?? null)}</CaptionContent>
        ) : (
            <div className="widget-combobox-caption-custom">{}</div>
        );
    }
}
