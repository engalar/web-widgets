import { createElement, ReactElement, useCallback, useEffect, useRef, useState, RefObject } from "react";
import classNames from "classnames";
import { usePositionObserver } from "./usePositionObserver.js";

interface FilterSelectorProps<T> {
    ariaLabel?: string;
    id?: string;
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; label: string }>;
}

export function FilterSelector<T>(props: FilterSelectorProps<T>): ReactElement {
    const { value, onChange } = props;
    const [show, setShow] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);
    const filterSelectorsRef = useRef<HTMLUListElement>(null);
    useOnClickOutside([componentRef, filterSelectorsRef], () => setShow(false));
    const position = usePositionObserver(componentRef.current, show);

    const onClick = useCallback(
        (value: T) => {
            onChange(value);
            setShow(false);
        },
        [onChange]
    );

    const filterSelectors = (
        <ul
            ref={filterSelectorsRef}
            id={`${props.id}-filter-selectors`}
            className="filter-selectors"
            role="menu"
            data-focusindex={0}
            style={{ position: "fixed", top: position?.bottom, left: position?.left }}
        >
            {props.options.map((option, index) => (
                <li
                    className={classNames({ "filter-selected": value === option.value })}
                    key={index}
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClick(option.value);
                    }}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick(option.value);
                        } else if (e.key === "Tab" && index + 1 === props.options.length) {
                            e.preventDefault();
                            onClick(value);
                        } else if ((e.key === "Tab" && e.shiftKey && index === 0) || e.key === "Escape") {
                            e.preventDefault();
                            componentRef.current?.querySelector("button")?.focus();
                            setShow(false);
                        }
                    }}
                    role="menuitem"
                    tabIndex={0}
                >
                    <div className={classNames("filter-icon", option.value as string)} aria-hidden />
                    <div className="filter-label">{option.label}</div>
                </li>
            ))}
        </ul>
    );

    const containerClick = useCallback(() => {
        setShow(prev => !prev);
        setTimeout(() => {
            (filterSelectorsRef.current?.querySelector("li.filter-selected") as HTMLElement)?.focus();
        }, 10);
    }, []);

    return (
        <div className="filter-selector">
            <div className="filter-selector-content" ref={componentRef}>
                <button
                    aria-controls={`${props.id}-filter-selectors`}
                    aria-expanded={show}
                    aria-haspopup
                    aria-label={props.ariaLabel}
                    className={classNames("btn btn-default filter-selector-button button-icon", value as string)}
                    onClick={containerClick}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            containerClick();
                        }
                    }}
                >
                    &nbsp;
                </button>
                {show && filterSelectors}
            </div>
        </div>
    );
}

function useOnClickOutside(ref: RefObject<HTMLElement> | Array<RefObject<HTMLElement>>, handler: () => void): void {
    useEffect(() => {
        const listener = (event: MouseEvent & { target: Node | null }): void => {
            if (Array.isArray(ref)) {
                if (ref.some(r => !r.current || r.current.contains(event.target))) {
                    return;
                }
            } else if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}
