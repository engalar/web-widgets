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
                locale={{
                    // Options.jsx
                    items_per_page: "条/页",
                    jump_to: "跳至",
                    jump_to_confirm: "确定",
                    page: "页",
                    // Pagination.jsx
                    prev_page: "上一页",
                    next_page: "下一页",
                    prev_5: "向前 5 页",
                    next_5: "向后 5 页",
                    prev_3: "向前 3 页",
                    next_3: "向后 3 页"
                }}
                showQuickJumper
                showSizeChanger
                pageSizeOptions={[5, 10, 20, 50, 100]}
                current={props.page + 1}
                total={props.numberOfItems ?? (numberOfPages ?? 1) * props.pageSize}
                showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 项`}
                pageSize={previousPageSize}
                onChange={onChange}
            />
        </div>
    );
}
