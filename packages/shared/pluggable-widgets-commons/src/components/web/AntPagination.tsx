import { Pagination } from "antd";
import { createElement, ReactElement, useCallback, useState } from "react";

import "antd/es/pagination/style/css";

export interface AntPaginationProps {
    canNextPage: boolean;
    canPreviousPage: boolean;
    gotoPage: (page: number, pageSize?: number) => void;
    nextPage: () => void;
    numberOfItems?: number;
    page: number;
    pageSize: number;
    previousPage: () => void;
}

export function AntPagination(props: AntPaginationProps): ReactElement | null {
    const [previousPageSize, setPreviousPageSize] = useState(props.pageSize);

    const onChange = useCallback(
        (page: number, pageSize: number): void => {
            if (previousPageSize !== pageSize) {
                props.gotoPage(0, pageSize);
                setPreviousPageSize(pageSize);
            } else {
                props.gotoPage(page - 1, pageSize);
            }
        },
        [previousPageSize]
    );
    const numberOfPages =
        props.numberOfItems !== undefined ? Math.ceil(props.numberOfItems / props.pageSize) : undefined;

    if (props.numberOfItems === 0) {
        return null;
    }

    return (
        <div aria-label="Pagination" className="pagination-bar" role="pagination">
            <Pagination
                showQuickJumper
                showSizeChanger
                pageSizeOptions={[5, 10, 20, 50, 100]}
                current={props.page + 1}
                total={props.numberOfItems ?? (numberOfPages ?? 1) * props.pageSize}
                pageSize={previousPageSize}
                onChange={onChange}
            />
        </div>
    );
}
