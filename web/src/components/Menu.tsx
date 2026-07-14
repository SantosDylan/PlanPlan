import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FC,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  FloatingOverlay,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useRole,
} from '@floating-ui/react';
import { css } from '../../styled-system/css';
import { useIsDesktop } from '../hooks/useIsDesktop.js';

type MenuContextValue = {
  activeIndex: number | null;
  getItemProps: (userProps?: Record<string, unknown>) => Record<string, unknown>;
  close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

type TriggerProps = {
  ref: (node: HTMLElement | null) => void;
  'aria-label': string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
};

type MenuProps = {
  /** Accessible name for the trigger and the menu surface. */
  label: string;
  /** Heading shown above the items on the mobile bottom-sheet. Defaults to `label`. */
  title?: string;
  /** Renders the trigger. Spread `props` onto a focusable element (usually a `<button>`). */
  trigger: (props: TriggerProps, state: { open: boolean }) => ReactNode;
  children: ReactNode;
};

const popoverClass = css({
  minW: '200px',
  bg: 'surfaceSheet',
  rounded: 'lg',
  border: '1px solid',
  borderColor: 'border',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  p: '1.5',
  display: 'flex',
  flexDir: 'column',
  gap: '0.5',
  zIndex: '50',
  outline: 'none',
});

const overlayClass = css({
  zIndex: '40',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  bg: 'rgba(10, 8, 6, 0.62)',
});

const sheetClass = css({
  position: 'relative',
  w: 'full',
  maxW: '480px',
  bg: 'surfaceSheet',
  rounded: '12px 12px 0 0',
  px: '3',
  py: '5',
  display: 'flex',
  flexDir: 'column',
  gap: '2',
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.2)',
  outline: 'none',
});

const sheetTitleClass = css({ fontSize: 'md', fontWeight: 'bold', m: '0', px: '3' });

const handleClass = css({
  alignSelf: 'center',
  w: '9',
  h: '1',
  rounded: 'full',
  bg: 'borderStrong',
  mb: '1',
  touchAction: 'none',
  cursor: 'grab',
});

// Distance (px) the sheet must be dragged down before release counts as "dismiss".
const DISMISS_THRESHOLD_PX = 80;

/**
 * Responsive menu primitive: an anchored popover on desktop (≥md) and a
 * bottom-sheet on mobile (<md). Open/close, focus trapping, dismiss (Escape /
 * outside-press), and arrow-key list navigation are handled by @floating-ui/react.
 * Pair with {@link MenuItem} for keyboard-navigable, selectable entries.
 */
export const Menu: FC<MenuProps> = ({ label, title, trigger, children }) => {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([click, dismiss, role, listNavigation]);

  const close = () => setOpen(false);
  const menuContext = useMemo<MenuContextValue>(
    () => ({ activeIndex, getItemProps, close }),
    [activeIndex, getItemProps],
  );

  const handleDragStart = (event: ReactPointerEvent<HTMLSpanElement>) => {
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleDragMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!isDragging) return;
    setDragY(Math.max(0, event.clientY - dragStartYRef.current));
  };
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD_PX) close();
    setDragY(0);
  };

  const triggerNode = trigger(
    {
      ref: refs.setReference,
      'aria-label': label,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      ...getReferenceProps(),
    } as TriggerProps,
    { open },
  );

  return (
    <>
      {triggerNode}
      {open && (
        <MenuContext.Provider value={menuContext}>
          <FloatingList elementsRef={listRef}>
            <FloatingPortal>
              {isDesktop ? (
                <FloatingFocusManager context={context} modal={false}>
                  <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    aria-label={label}
                    className={popoverClass}
                    {...getFloatingProps()}
                  >
                    {children}
                  </div>
                </FloatingFocusManager>
              ) : (
                <FloatingOverlay
                  lockScroll
                  className={overlayClass}
                  style={{ opacity: 1 - Math.min(dragY / (DISMISS_THRESHOLD_PX * 3), 0.6) }}
                >
                  <FloatingFocusManager context={context} modal>
                    <div
                      ref={refs.setFloating}
                      aria-label={label}
                      className={sheetClass}
                      style={{
                        transform: `translateY(${dragY}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                      }}
                      {...getFloatingProps()}
                    >
                      <span
                        aria-hidden="true"
                        className={handleClass}
                        onPointerDown={handleDragStart}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onPointerCancel={handleDragEnd}
                      />
                      {(title ?? label) && <h2 className={sheetTitleClass}>{title ?? label}</h2>}
                      {children}
                    </div>
                  </FloatingFocusManager>
                </FloatingOverlay>
              )}
            </FloatingPortal>
          </FloatingList>
        </MenuContext.Provider>
      )}
    </>
  );
};

type MenuItemProps = {
  children: ReactNode;
  /** Fired on click / Enter / Space. */
  onSelect?: () => void;
  /** Renders as `aria-checked` (radio semantics) and a filled active style. */
  selected?: boolean;
  /** Close the menu after selecting. Defaults to `true`. */
  closeOnSelect?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect' | 'children'>;

/** A single selectable entry inside a {@link Menu}. Must be rendered within one. */
export const MenuItem: FC<MenuItemProps> = ({ children, onSelect, selected = false, closeOnSelect = true, ...rest }) => {
  const menu = useContext(MenuContext);
  const { ref, index } = useListItem();

  if (!menu) throw new Error('<MenuItem> must be rendered inside a <Menu>.');

  const isActive = menu.activeIndex === index;

  return (
    <button
      ref={ref}
      type="button"
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        w: 'full',
        textAlign: 'left',
        px: '3',
        h: '10',
        rounded: 'md',
        border: 'none',
        cursor: 'pointer',
        fontSize: 'sm',
        fontWeight: selected ? 'semibold' : 'medium',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        bg: selected ? 'accentSoft' : isActive ? 'hairline' : 'transparent',
        color: selected ? 'accent' : 'paper',
      })}
      {...rest}
      {...menu.getItemProps({
        onClick() {
          onSelect?.();
          if (closeOnSelect) menu.close();
        },
      })}
      role="menuitemradio"
      aria-checked={selected}
    >
      <span className={css({ flex: '1', minW: '0', display: 'flex', alignItems: 'center', gap: '2' })}>{children}</span>
      {selected && (
        <span aria-hidden="true" className={css({ flexShrink: '0', fontSize: 'sm', lineHeight: '1' })}>
          ✓
        </span>
      )}
    </button>
  );
};
