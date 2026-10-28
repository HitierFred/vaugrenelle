// Types partagés par les composants d'interface

export type IconName =
  | 'check'
  | 'alert'
  | 'error'
  | 'info'
  | 'clock'
  | 'calendar'
  | 'pin'
  | 'access'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'menu'
  | 'close'
  | 'user'
  | 'ticket'
  | 'box'
  | 'bolt'
  | 'file'
  | 'minus';

export type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type Accessibilite = 'pmr' | 'lsf' | 'audiodescription' | 'boucle-magnetique' | 'relax';

export type Disponibilite =
  'reservable' | 'disponible' | 'partiel' | 'indisponible' | 'hors-service';
