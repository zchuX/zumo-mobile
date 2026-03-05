import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

/** Map web material-symbols-outlined names to MaterialIcons (expo) names. */
const nameMap: Record<string, string> = {
  arrow_back_ios_new: 'arrow-back',
  arrow_forward: 'arrow-forward',
  arrow_forward_ios: 'arrow-forward',
  calendar_today: 'calendar-today',
  directions_car: 'directions-car',
  add: 'add',
  group: 'group',
  person: 'person',
  garage: 'garage',
  settings: 'settings',
  search: 'search',
  edit: 'edit',
  badge: 'badge',
  lock: 'lock',
  contact_support: 'contact-support',
  chevron_left: 'chevron-left',
  chevron_right: 'chevron-right',
  language: 'language',
  visibility: 'visibility',
  visibility_off: 'visibility-off',
  alternate_email: 'alternate-email',
  help_center: 'help',
  event: 'event',
  history: 'history',
  delete: 'delete',
  hourglass_empty: 'hourglass-empty',
  expand_more: 'expand-more',
  expand_less: 'expand-less',
  check: 'check',
  pets: 'pets',
  share: 'share',
  share_windows: 'share',
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

export default function Icon({ name, size = 24, color = colors.slate[700], style }: IconProps) {
  const mapped = (nameMap[name] ?? name.replace(/_/g, '-')) as React.ComponentProps<typeof MaterialIcons>['name'];
  return <MaterialIcons name={mapped} size={size} color={color} style={style} />;
}
