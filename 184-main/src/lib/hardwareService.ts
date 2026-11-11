/**
 * CyberCast Hardware Interfacing Service
 * Communicates with /api/hardware/adb-sms for Method A Android Hardware Showcase
 */

export interface AdbDeviceStatus {
  connected: boolean;
  mode: 'hardware' | 'simulation' | 'cloud_bridge';
  unauthorized?: boolean;
  deviceState?: string;
  deviceId: string | null;
  model: string | null;
  adbPath?: string;
  targetConfigured?: string;
  warning?: string;
  cloudBridgeSupported?: boolean;
  bridgeChannel?: string;
  timestamp: string;
}

export interface AdbSmsPayload {
  phone: string;
  message: string;
  priority?: 'FLASH_P1' | 'URGENT_P2';
  officerName?: string;
  caseId?: string;
}

export interface AdbSmsResponse {
  success: boolean;
  mode: 'hardware' | 'simulation' | 'cloud_bridge';
  status: string;
  hardwareDispatched?: boolean;
  channel?: string;
  deviceId: string | null;
  model?: string | null;
  phone: string;
  message: string;
  priority?: string;
  officerName?: string;
  caseId?: string;
  timestamp: string;
  dltReference: string;
  stdout?: string;
  warning?: string;
  error?: string;
}

/**
 * Checks physical ADB device connectivity.
 */
export async function checkAdbDeviceStatus(): Promise<AdbDeviceStatus> {
  try {
    const res = await fetch('/api/hardware/adb-sms', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      mode: 'simulation',
      deviceId: null,
      model: null,
      warning: err.message || 'Status fetch failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Sends SMS directive to physical Android device via ADB Intent (Method A).
 * Automatically falls back to simulated dispatch if device is unavailable.
 */
export async function sendAdbSms(payload: AdbSmsPayload): Promise<AdbSmsResponse> {
  const dltReference = `DLT-1407-${Math.floor(100000 + Math.random() * 900000)}`;
  try {
    const res = await fetch('/api/hardware/adb-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.warning || errData.error || `HTTP ${res.status}`);
    }

    const data: AdbSmsResponse = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[hardwareService.sendAdbSms fallback]:', err);
    return {
      success: true,
      mode: 'simulation',
      status: 'CLIENT_FALLBACK',
      hardwareDispatched: false,
      deviceId: null,
      phone: payload.phone,
      message: payload.message,
      priority: payload.priority || 'FLASH_P1',
      officerName: payload.officerName || 'Assigned Officer',
      caseId: payload.caseId || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      dltReference,
      warning: err.message || 'Hardware API call failed; fallback simulation active',
    };
  }
}
