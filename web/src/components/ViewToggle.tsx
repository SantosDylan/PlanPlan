import type { FC } from 'react';
import { css } from '#styled-system/css';
import type { CatalogView } from '#src/hooks/useCatalogView.js';

const trackClass = css({
  display: 'flex',
  gap: '1.5',
});

const TABS: { view: CatalogView; label: string }[] = [
  { view: 'grille', label: 'Grille' },
  { view: 'agenda', label: 'Agenda' },
];

type ViewToggleProps = {
  view: CatalogView;
  onChange: (view: CatalogView) => void;
  panelId: string;
};

/** Bascule Grille/Agenda — l'onglet actif se distingue par un fond plein (pas la seule couleur). */
export const ViewToggle: FC<ViewToggleProps> = ({ view, onChange, panelId }) => (
  <div role="tablist" aria-label="Affichage" className={trackClass}>
    {TABS.map((tab) => {
      const active = tab.view === view;
      return (
        <button
          key={tab.view}
          type="button"
          role="tab"
          id={`view-tab-${tab.view}`}
          aria-selected={active}
          aria-controls={panelId}
          onClick={() => onChange(tab.view)}
          className={css({
            flex: '1',
            textAlign: 'center',
            fontSize: 'xs',
            fontWeight: 'semibold',
            py: '1',
            rounded: 'lg',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
            bg: active ? 'paper' : 'transparent',
            color: active ? 'accentText' : 'paperMuted',
          })}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
