import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FC,
  type ReactNode,
} from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
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
import { css } from '#styled-system/css';
import { Sheet } from './Sheet.js';
import { useIsDesktop } from '#src/hooks/useIsDesktop.js';

type MenuContextValue = {
  activeIndex: number | null;
  getItemProps: (userProps?: Record<string, unknown>) => Record<string, unknown>;
  close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

type TriggerProps = {
  ref: (node: HTMLElement | null) => void;
  'aria-label': string;
  'aria-haspopup': 'menu' | 'dialog';
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
  borderColor: 'hairline',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  p: '1.5',
  display: 'flex',
  flexDir: 'column',
  gap: '0.5',
  zIndex: '50',
  outline: 'none',
});

// Pulled 3 units wider than the body's padding so each item's own `px: 3` puts its label
// flush with the sheet title, while its hover/selected background bleeds further out.
const sheetListClass = css({ display: 'flex', flexDir: 'column', gap: '1', mx: '-3' });

/**
 * Responsive menu primitive: an anchored popover on desktop (≥md) and a {@link Sheet} on
 * mobile (<md). @floating-ui/react drives the desktop side — anchoring, focus, dismiss and
 * arrow-key list navigation; the mobile side hands focus, dismiss and drag to the sheet, so
 * `useDismiss`/`useRole` stay desktop-only (their outside-press would fire on taps *inside*
 * the portalled sheet, which floating-ui doesn't know about). `useListNavigation` stays on in
 * both: {@link MenuItem} sources its props from it.
 * Pair with {@link MenuItem} for keyboard-navigable, selectable entries.
 */
export const Menu: FC<MenuProps> = ({ label, title, trigger, children }) => {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<Array<HTMLElement | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { enabled: isDesktop });
  const role = useRole(context, { role: 'menu', enabled: isDesktop });
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

  const triggerNode = trigger(
    {
      ref: refs.setReference,
      'aria-label': label,
      'aria-haspopup': isDesktop ? 'menu' : 'dialog',
      'aria-expanded': open,
      ...getReferenceProps(),
    } as TriggerProps,
    { open },
  );

  return (
    <>
      {triggerNode}
      <MenuContext.Provider value={menuContext}>
        <FloatingList elementsRef={listRef}>
          {isDesktop ? (
            open && (
              <FloatingPortal>
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
              </FloatingPortal>
            )
          ) : (
            <Sheet open={open} onOpenChange={setOpen} title={title ?? label} bodyCss={{ px: '6', gap: '2' }}>
              {/* `menuitemradio` needs an owning `menu` — the sheet itself is a `dialog`. */}
              <div role="menu" aria-label={label} className={sheetListClass}>
                {children}
              </div>
            </Sheet>
          )}
        </FloatingList>
      </MenuContext.Provider>
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
