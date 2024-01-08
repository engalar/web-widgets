import { createElement } from "react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { render, RenderResult } from "@testing-library/react";
import { objectItems } from "@mendix/widget-plugin-test-utils";
import { CellContext } from "../base";
import { createSelectHandlers } from "../select-handlers";
import { eventSwitch } from "@mendix/widget-plugin-grid/event-switch/event-switch";
import { SelectionType } from "@mendix/widget-plugin-grid/selection";
import { createActionHandlers } from "../action-handlers";
import { SelectionMethod } from "../../../helpers/SelectActionHelper";
import { ClickTrigger } from "../../../helpers/ClickActionHelper";

function setup(jsx: React.ReactElement): { user: UserEvent } & RenderResult {
    return {
        user: userEvent.setup(),
        ...render(jsx)
    };
}

describe("grid cell", () => {
    describe("on shift+space event", () => {
        const cases = [
            { ct: "single", sm: "rowClick", n: 1 },
            { ct: "double", sm: "rowClick", n: 1 },
            { ct: "none", sm: "rowClick", n: 1 },
            { ct: "single", sm: "checkbox", n: 1 },
            { ct: "double", sm: "checkbox", n: 1 },
            { ct: "none", sm: "checkbox", n: 1 },
            { ct: "single", sm: "none", n: 0 },
            { ct: "double", sm: "none", n: 0 },
            { ct: "none", sm: "none", n: 0 }
        ];

        test.each(cases)(
            "calls onSelect $n time(s) when selection method is $sm and click trigger is $ct",
            async ({ ct, sm, n }) => {
                const onSelect = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: sm as SelectionMethod,
                        selectionType: "Single",
                        clickTrigger: ct as ClickTrigger
                    }),
                    [...createSelectHandlers(onSelect, jest.fn(), jest.fn())]
                );

                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard("{Shift>}[Space]{/Shift}");

                expect(onSelect).toHaveBeenCalledTimes(n);
                if (n > 0) {
                    expect(onSelect).toHaveBeenLastCalledWith(item, false);
                }
            }
        );
    });

    describe("on keydown{KeyA} event", () => {
        const cases = [
            { selectionType: "None", n: 0, prefix: "MetaLeft" },
            { selectionType: "Single", n: 0, prefix: "MetaLeft" },
            { selectionType: "Multi", n: 1, prefix: "MetaLeft" },
            { selectionType: "Multi", n: 1, prefix: "MetaRight" },
            { selectionType: "Multi", n: 1, prefix: "ControlLeft" },
            { selectionType: "Multi", n: 1, prefix: "ControlRight" }
        ];

        test.each(cases)(
            "calls onSelectAll $n time(s) when selection is $selectionType and key $prefix is pressed",
            async ({ selectionType, n, prefix }) => {
                const onSelectAll = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: "rowClick",
                        selectionType: selectionType as SelectionType,
                        clickTrigger: "none"
                    }),
                    [...createSelectHandlers(jest.fn(), onSelectAll, jest.fn())]
                );

                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard(`[${prefix}>]a[/${prefix}]`);

                expect(onSelectAll).toHaveBeenCalledTimes(n);
                if (n > 0) {
                    expect(onSelectAll).toHaveBeenLastCalledWith("selectAll");
                }
            }
        );
    });

    describe("on keydown event", () => {
        const cases = [
            { selectionType: "None", n: 0, key: "ArrowUp", params: [true, "backward", 1] },
            { selectionType: "Single", n: 0, key: "ArrowDown", params: [true, "forward", 1] },
            { selectionType: "Multi", n: 1, key: "ArrowUp", params: [true, "backward", 1] },
            { selectionType: "Multi", n: 1, key: "ArrowDown", params: [true, "forward", 1] },
            { selectionType: "Multi", n: 1, key: "PageUp", params: [true, "backward", 10] },
            { selectionType: "Multi", n: 1, key: "PageDown", params: [true, "forward", 10] },
            { selectionType: "Multi", n: 1, key: "Home", params: [true, "backward", "edge"] },
            { selectionType: "Multi", n: 1, key: "End", params: [true, "forward", "edge"] }
        ];

        test.each(cases)(
            "calls onSelectAdjacent $n time(s) when selection is $selectionType and key is $key",
            async ({ selectionType, n, key, params }) => {
                const onSelectAdjacent = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: "rowClick",
                        selectionType: selectionType as SelectionType,
                        clickTrigger: "none"
                    }),
                    [...createSelectHandlers(jest.fn(), jest.fn(), onSelectAdjacent)]
                );

                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard(`{Shift>}[${key}]{/Shift}`);

                expect(onSelectAdjacent).toHaveBeenCalledTimes(n);
                if (n > 0) {
                    expect(onSelectAdjacent).toHaveBeenLastCalledWith(item, ...params);
                }
            }
        );
    });

    describe("on keyup[Space|Enter] event", () => {
        const cases = [
            { ct: "single", n: 1, key: "Space" },
            { ct: "double", n: 1, key: "Space" },
            { ct: "none", n: 0, key: "Space" },
            { ct: "single", n: 1, key: "Enter" },
            { ct: "double", n: 1, key: "Enter" },
            { ct: "none", n: 0, key: "Enter" }
        ];

        test.each(cases)(
            "calls onExecuteAction $n time(s) when click trigger is $ct and key is $key",
            async ({ ct, n, key }) => {
                const onExecuteAction = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: "none",
                        selectionType: "None",
                        clickTrigger: ct as ClickTrigger
                    }),
                    [...createActionHandlers(onExecuteAction)]
                );
                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard(`[${key}]`);
                expect(onExecuteAction).toHaveBeenCalledTimes(n);
            }
        );

        test("calls onExecuteAction only if keydown[Space] event was emitted earlier on the current target", async () => {
            const onExecuteAction = jest.fn();

            const [item] = objectItems(1);

            const props = eventSwitch<CellContext, HTMLDivElement>(
                (): CellContext => ({
                    item,
                    pageSize: 10,
                    selectionMethod: "none",
                    selectionType: "None",
                    clickTrigger: "single"
                }),
                [...createActionHandlers(onExecuteAction)]
            );
            const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
            // start on document.body
            await user.keyboard(`[Space>]`);
            // move to focus to cell
            await user.tab();
            // release space key
            await user.keyboard(`[/Space]`);
            expect(onExecuteAction).toHaveBeenCalledTimes(0);
        });

        test("calls onExecuteAction only if keydown[Enter] event was emitted earlier on the current target", async () => {
            const onExecuteAction = jest.fn();

            const [item] = objectItems(1);

            const props = eventSwitch<CellContext, HTMLDivElement>(
                (): CellContext => ({
                    item,
                    pageSize: 10,
                    selectionMethod: "none",
                    selectionType: "None",
                    clickTrigger: "single"
                }),
                [...createActionHandlers(onExecuteAction)]
            );
            const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
            // start on document.body
            await user.keyboard(`[Enter>]`);
            // move to focus to cell
            await user.tab();
            // release space enter
            await user.keyboard(`[/Enter]`);
            expect(onExecuteAction).toHaveBeenCalledTimes(0);
        });
    });

    describe("on keyup[Space] event", () => {
        const cases = ["Single", "Multi"];
        test.each(cases)(
            "don't calls onExecuteAction when selection type is %s",
            async (selectionType: SelectionType) => {
                const onExecuteAction = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: "checkbox",
                        selectionType,
                        clickTrigger: "single"
                    }),
                    [...createActionHandlers(onExecuteAction)]
                );
                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard(`[Space]`);
                expect(onExecuteAction).toHaveBeenCalledTimes(0);
            }
        );
    });

    describe("on keyup[Enter] event", () => {
        const cases = ["Single", "Multi", "None"];
        test.each(cases)(
            "calls onExecuteAction even when selection type is %s",
            async (selectionType: SelectionType) => {
                const onExecuteAction = jest.fn();

                const [item] = objectItems(1);

                const props = eventSwitch<CellContext, HTMLDivElement>(
                    (): CellContext => ({
                        item,
                        pageSize: 10,
                        selectionMethod: "checkbox",
                        selectionType,
                        clickTrigger: "single"
                    }),
                    [...createActionHandlers(onExecuteAction)]
                );
                const { user } = setup(<div role="gridcell" tabIndex={1} {...props} />);
                await user.tab();
                await user.keyboard(`[Enter]`);
                expect(onExecuteAction).toHaveBeenCalledTimes(1);
            }
        );
    });
});
