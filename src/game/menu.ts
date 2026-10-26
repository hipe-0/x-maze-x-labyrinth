export function titleItems(hasSave: boolean): readonly string[] {
  return ['NEW MAZE', 'VIEW MAP', hasSave ? 'CONTINUE' : 'PLAY']
}

export const PAUSE_ITEMS = ['RESUME', 'VIEW MAP', 'NEW MAZE', 'MAIN MENU'] as const

export const PAUSE_ITEM_ENABLED = [true, true, true, true] as const
