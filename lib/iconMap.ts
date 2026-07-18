'use client';

import React from 'react';
import {
  IconSeedling,
  IconMedal,
  IconTelescope,
  IconCompass,
  IconStack2,
  IconBulb,
  IconPuzzle,
  IconStar,
  IconChartBar,
  IconSum,
  IconTrophy,
  IconSchool,
  IconCrown,
  IconAward,
  IconHelp,
} from '@tabler/icons-react';

/**
 * Icon mapping for section tiers (14 class-level sections)
 * Maps icon_name from database to React icon components
 * Updated to use Tabler icons-react v3.44.0
 */
export const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  seedling: IconSeedling,      // Number Sprouts
  medal: IconMedal,             // Counting Champions
  telescope: IconTelescope,     // Math Explorers
  compass: IconCompass,         // Number Navigators
  'stack-2': IconStack2,        // Equation Builders (Note: IconStack2 in Tabler)
  bulb: IconBulb,               // Logic Leaders
  puzzle: IconPuzzle,           // Problem Solvers
  star: IconStar,               // Math Mavericks
  'chart-bar': IconChartBar,    // Junior Analysts
  sum: IconSum,                 // Algebra Masters
  trophy: IconTrophy,           // Olympiad Challengers
  school: IconSchool,           // Elite Mathematicians
  crown: IconCrown,             // Math Titans
  award: IconAward,             // Grand Olympians
  // Legacy aliases for backward compatibility
  calculator: IconBulb,
  sword: IconTrophy,
};

/**
 * Get the icon component for an icon name
 */
export function getIconComponent(iconName: string | undefined) {
  if (!iconName) return IconHelp;
  return ICON_COMPONENTS[iconName.toLowerCase()] || IconHelp;
}
