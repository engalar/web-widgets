import { createElement, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageState } from "ahooks";
import { ColumnsType, DatagridContainerProps } from "../typings/DatagridProps";
import { FilterCondition } from "mendix/filters";
import { and } from "mendix/filters/builders";
import { Table, TableColumn } from "./components/Table";
import {
    FilterFunction,
    FilterType,
    generateUUID,
    useFilterContext,
    useMultipleFiltering
} from "@mendix/pluggable-widgets-commons/components/web";
import { isAvailable, useSelectionHelper } from "@mendix/pluggable-widgets-commons";
import { extractFilters } from "./features/filters";
import { useCellRenderer } from "./features/cell";
import { getColumnAssociationProps, isSortable } from "./features/column";
import { selectionSettings, useOnSelectProps } from "./features/selection";
import "./ui/Datagrid.scss";

function getIdFromClass(clazz: string) {
    const className2 = clazz || "";
    let pattern = /mx-name-(\w+)/;
    let match = className2.match(pattern);
    let extracted;
    if (match) {
        extracted = match[1];
    } else {
        console.error("No match found");
    }
    return extracted;
}

export default function Datagrid(props: DatagridContainerProps): ReactElement {
    const id = useRef(`DataGrid${generateUUID()}`);

    const [sortParameters, setSortParameters] = useState<{ columnIndex: number; desc: boolean } | undefined>(undefined);
    const isInfiniteLoad = props.pagination === "virtualScrolling";
    const viewStateFilters = useRef<FilterCondition | undefined>(undefined);
    const [filtered, setFiltered] = useState(false);
    const multipleFilteringState = useMultipleFiltering();
    const { FilterContext } = useFilterContext();
    const cellRenderer = useCellRenderer({ columns: props.columns, onClick: props.onClick });

    const [pageSize, setPageSize] = useLocalStorageState(`DataGrid2-${getIdFromClass(props.class)}-pageSize`, {
        defaultValue: props.pageSize,
        listenStorageChange: true
    });

    useEffect(() => {
        if (props.datasource.filter && !filtered && !viewStateFilters.current) {
            viewStateFilters.current = props.datasource.filter;
        }
    }, [props.datasource, props.configurationAttribute, filtered]);

    useEffect(() => {
        if (props.refreshInterval > 0) {
            setTimeout(() => {
                props.datasource.reload();
            }, props.refreshInterval * 1000);
        }
    }, [props.datasource, props.refreshInterval]);

    const [currentPage, setCurrentPage] = useState(() =>
        isInfiniteLoad ? props.datasource.limit / pageSize! : props.datasource.offset / pageSize!
    );
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        props.datasource.requestTotalCount(true);
        if (props.datasource.limit === Number.POSITIVE_INFINITY) {
            props.datasource.setLimit(pageSize);
        }
        if (!isInfiniteLoad) {
            console.log("Setting offset ", props.datasource.offset, " pageSize ", pageSize);

            setOffset(props.datasource.offset);
        }
    }, [props.datasource, pageSize]);

    // update currentPage
    useEffect(() => {
        if (isInfiniteLoad) {
            setCurrentPage(offset / pageSize!);
        } else {
            setCurrentPage(offset / pageSize!);
        }
    }, [props.datasource, pageSize, isInfiniteLoad, offset]);

    const setPage = useCallback(
        (computePage, pageSize2) => {
            const newPage = computePage(currentPage);
            setPageSize(pageSize2);

            setCurrentPage(newPage);
            if (isInfiniteLoad) {
                props.datasource.setLimit(newPage * (pageSize2 ?? pageSize));
            } else {
                props.datasource.setOffset(newPage * (pageSize2 ?? pageSize));
                setOffset(newPage * (pageSize2 ?? pageSize));
                props.datasource.setLimit(pageSize2 ?? pageSize);
            }
        },
        [props.datasource, pageSize, isInfiniteLoad, currentPage, setPageSize]
    );

    // TODO: Rewrite this logic with single useReducer (or write
    // custom hook that will use useReducer)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const customFiltersState = props.columns.map(() => useState<FilterFunction>());

    const filters = customFiltersState
        .map(([customFilter]) => customFilter?.getFilterCondition?.())
        .filter((filter): filter is FilterCondition => filter !== undefined)
        .concat(
            // Concatenating multiple filter state
            Object.keys(multipleFilteringState)
                .map((key: FilterType) => multipleFilteringState[key][0]?.getFilterCondition())
                .filter((filter): filter is FilterCondition => filter !== undefined)
        );

    if (filters.length > 0) {
        props.datasource.setFilter(filters.length > 1 ? and(...filters) : filters[0]);
    } else if (filtered) {
        props.datasource.setFilter(undefined);
    } else {
        props.datasource.setFilter(viewStateFilters.current);
    }

    if (sortParameters) {
        props.datasource.setSortOrder([
            [props.columns[sortParameters.columnIndex].attribute!.id, sortParameters.desc ? "desc" : "asc"]
        ]);
    } else {
        props.datasource.setSortOrder(undefined);
    }

    const columns = useMemo(() => transformColumnProps(props.columns), [props.columns]);

    /**
     * Multiple filtering properties
     */
    const filterList = useMemo(
        () => props.filterList.reduce((filters, { filter }) => ({ ...filters, [filter.id]: filter }), {}),
        [props.filterList]
    );
    const multipleInitialFilters = useMemo(
        () =>
            props.filterList.reduce(
                (filters, { filter }) => ({
                    ...filters,
                    [filter.id]: extractFilters(filter, viewStateFilters.current)
                }),
                {}
            ),
        [props.filterList]
    );

    const selection = useSelectionHelper(
        props.itemSelection,
        props.datasource,
        props.onSelectionChange,
        props.newTrialSwitch,
        props.historyVersion
    );
    const selectActionProps = useOnSelectProps(selection);
    const { selectionStatus, selectionMethod } = selectionSettings(props, selection);
    return (
        <Table
            selectionStatus={selectionStatus}
            selectionMethod={selectionMethod}
            cellRenderer={cellRenderer}
            className={props.class}
            columns={columns}
            columnsDraggable={props.columnsDraggable}
            columnsFilterable={props.columnsFilterable}
            columnsHidable={props.columnsHidable}
            columnsResizable={props.columnsResizable}
            columnsSortable={props.columnsSortable}
            data={props.datasource.items ?? []}
            emptyPlaceholderRenderer={useCallback(
                renderWrapper =>
                    props.showEmptyPlaceholder === "custom" ? renderWrapper(props.emptyPlaceholder) : <div />,
                [props.emptyPlaceholder, props.showEmptyPlaceholder]
            )}
            filterRenderer={useCallback(
                (renderWrapper, columnIndex) => {
                    const column = props.columns[columnIndex];
                    const { attribute, filter } = column;
                    const associationProps = getColumnAssociationProps(column);
                    const [, filterDispatcher] = customFiltersState[columnIndex];
                    const initialFilters = extractFilters(attribute, viewStateFilters.current);

                    if (!attribute && !associationProps) {
                        return renderWrapper(filter);
                    }

                    return renderWrapper(
                        <FilterContext.Provider
                            value={{
                                filterDispatcher: prev => {
                                    setFiltered(true);
                                    filterDispatcher(prev);
                                    return prev;
                                },
                                singleAttribute: attribute,
                                singleInitialFilter: initialFilters,
                                associationProperties: associationProps
                            }}
                        >
                            {filter}
                        </FilterContext.Provider>
                    );
                },
                [FilterContext, customFiltersState, props.columns]
            )}
            filtersTitle={props.filterSectionTitle?.value}
            hasMoreItems={props.datasource.hasMoreItems ?? false}
            headerWrapperRenderer={useCallback((_columnIndex: number, header: ReactElement) => header, [])}
            headerFilters={useMemo(
                () => (
                    <FilterContext.Provider
                        value={{
                            filterDispatcher: prev => {
                                if (prev.filterType) {
                                    const [, filterDispatcher] = multipleFilteringState[prev.filterType];
                                    filterDispatcher(prev);
                                    setFiltered(true);
                                }
                                return prev;
                            },
                            multipleAttributes: filterList,
                            multipleInitialFilters
                        }}
                    >
                        {props.filtersPlaceholder}
                    </FilterContext.Provider>
                ),
                [FilterContext, filterList, multipleInitialFilters, props.filtersPlaceholder, multipleFilteringState]
            )}
            id={id.current}
            numberOfItems={props.datasource.totalCount}
            page={currentPage}
            pageSize={pageSize!}
            paging={props.pagination === "buttons"}
            pagingPosition={props.pagingPosition}
            rowClass={useCallback(value => props.rowClass?.get(value)?.value ?? "", [props.rowClass])}
            setPage={setPage}
            setSortParameters={setSortParameters}
            settings={props.configurationAttribute}
            styles={props.style}
            valueForSort={useCallback(
                (value, columnIndex) => {
                    const column = props.columns[columnIndex];
                    return column.attribute ? column.attribute.get(value).value : "";
                },
                [props.columns]
            )}
            onSelect={selectActionProps.onSelect}
            onSelectAll={selectActionProps.onSelectAll}
            isSelected={selectActionProps.isSelected}
        />
    );
}

function transformColumnProps(props: ColumnsType[]): TableColumn[] {
    return props.map(prop => ({
        ...prop,
        header: prop.header && isAvailable(prop.header) ? prop.header.value ?? "" : "",
        sortable: isSortable(prop)
    }));
}
