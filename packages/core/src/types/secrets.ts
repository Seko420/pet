import type { IsoDateTime } from './common';

export type SecretService =
  | 'roblox_open_cloud'
  | 'anthropic'
  | 'openai'
  | 'custom_ai'
  | 'google_play'
  | 'custom';

/**
 * Public metadata of a stored secret.
 * The plaintext value NEVER leaves the main process; the renderer only ever
 * sees this reference object.
 */
export interface SecretRef {
  id: string;
  name: string;
  service: SecretService;
  /** Last 4 characters for recognition, e.g. "...k3Yx". */
  hint: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export const SECRET_SERVICE_LABELS: Record<SecretService, string> = {
  roblox_open_cloud: 'Roblox Open Cloud API Key',
  anthropic: 'Anthropic API Key (KI)',
  openai: 'OpenAI API Key (KI)',
  custom_ai: 'Eigene KI-API (OpenAI-kompatibel)',
  google_play: 'Google Play (später)',
  custom: 'Sonstiger Key',
};
