// Validation utilities for network configuration

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate IP address format
export function isValidIP(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

// Validate SSID
export function isValidSSID(ssid: string): boolean {
  // SSID must be 1-32 characters
  return ssid.length > 0 && ssid.length <= 32;
}

// Validate WiFi password
export function isValidWiFiPassword(password: string): boolean {
  // Empty is valid (means keep current password)
  // Otherwise must be 8-63 characters
  if (password === '') return true;
  return password.length >= 8 && password.length <= 63;
}

// Validate WiFi configuration
export function validateWiFiConfig(config: {
  ssid: string;
  password: string;
  ip: string;
  gateway: string;
  subnet: string;
  dns: string;
  dhcp: boolean;
}): ValidationResult {
  const errors: string[] = [];

  // Validate SSID
  if (!config.ssid || config.ssid.trim() === '') {
    errors.push('SSID is required');
  } else if (!isValidSSID(config.ssid)) {
    errors.push('SSID must be 1-32 characters');
  }

  // Validate password
  if (!isValidWiFiPassword(config.password)) {
    errors.push('Password must be 8-63 characters if provided');
  }

  // Validate static IP settings if DHCP is disabled
  if (!config.dhcp) {
    if (!config.ip || config.ip.trim() === '') {
      errors.push('IP address is required when DHCP is disabled');
    } else if (!isValidIP(config.ip)) {
      errors.push('Invalid IP address format');
    }

    if (!config.gateway || config.gateway.trim() === '') {
      errors.push('Gateway is required when DHCP is disabled');
    } else if (!isValidIP(config.gateway)) {
      errors.push('Invalid gateway format');
    }

    if (!config.subnet || config.subnet.trim() === '') {
      errors.push('Subnet mask is required when DHCP is disabled');
    } else if (!isValidIP(config.subnet)) {
      errors.push('Invalid subnet mask format');
    }

    if (!config.dns || config.dns.trim() === '') {
      errors.push('DNS server is required when DHCP is disabled');
    } else if (!isValidIP(config.dns)) {
      errors.push('Invalid DNS server format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate Access Point configuration
export function validateAPConfig(config: {
  ssid: string;
  password: string;
  channel: number;
  maxClients: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate SSID
  if (!config.ssid || config.ssid.trim() === '') {
    errors.push('AP SSID is required');
  } else if (!isValidSSID(config.ssid)) {
    errors.push('AP SSID must be 1-32 characters');
  }

  // Validate password
  if (!isValidWiFiPassword(config.password)) {
    errors.push('AP password must be 8-63 characters if provided');
  }

  // Validate channel (0 = auto, 1-13 = specific)
  if (config.channel < 0 || config.channel > 13) {
    errors.push('WiFi channel must be 0 (auto) or between 1 and 13');
  }

  // Validate max clients (0 = hardware default, 1-8 = specific)
  if (config.maxClients < 0 || config.maxClients > 8) {
    errors.push('Max clients must be 0 (auto) or between 1 and 8');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate hostname
export function isValidHostname(hostname: string): boolean {
  // Hostname must be 1-63 characters, alphanumeric and hyphens only
  // Cannot start or end with hyphen
  if (!hostname || hostname.length === 0 || hostname.length > 63) return false;
  if (hostname.startsWith('-') || hostname.endsWith('-')) return false;
  return /^[a-zA-Z0-9-]+$/.test(hostname);
}

// Validate hostname configuration
export function validateHostnameConfig(config: {
  hostname: string;
  mdnsEnabled: boolean;
}): ValidationResult {
  const errors: string[] = [];

  if (!config.hostname || config.hostname.trim() === '') {
    errors.push('Hostname is required');
  } else if (!isValidHostname(config.hostname)) {
    errors.push('Hostname must be 1-63 characters, alphanumeric and hyphens only, cannot start/end with hyphen');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate WiFi profile
export function validateWiFiProfile(profile: {
  name: string;
  ssid: string;
  password: string;
  ip: string;
  gateway: string;
  subnet: string;
  dns: string;
  dhcp: boolean;
}): ValidationResult {
  const errors: string[] = [];

  // Validate profile name
  if (!profile.name || profile.name.trim() === '') {
    errors.push('Profile name is required');
  } else if (profile.name.length > 32) {
    errors.push('Profile name must be 32 characters or less');
  }

  // Validate SSID
  if (!profile.ssid || profile.ssid.trim() === '') {
    errors.push('SSID is required');
  } else if (!isValidSSID(profile.ssid)) {
    errors.push('SSID must be 1-32 characters');
  }

  // Validate password
  if (!isValidWiFiPassword(profile.password)) {
    errors.push('Password must be 8-63 characters if provided');
  }

  // Validate static IP settings if DHCP is disabled
  if (!profile.dhcp) {
    if (!profile.ip || profile.ip.trim() === '') {
      errors.push('IP address is required when DHCP is disabled');
    } else if (!isValidIP(profile.ip)) {
      errors.push('Invalid IP address format');
    }

    if (!profile.gateway || profile.gateway.trim() === '') {
      errors.push('Gateway is required when DHCP is disabled');
    } else if (!isValidIP(profile.gateway)) {
      errors.push('Invalid gateway format');
    }

    if (!profile.subnet || profile.subnet.trim() === '') {
      errors.push('Subnet mask is required when DHCP is disabled');
    } else if (!isValidIP(profile.subnet)) {
      errors.push('Invalid subnet mask format');
    }

    if (!profile.dns || profile.dns.trim() === '') {
      errors.push('DNS server is required when DHCP is disabled');
    } else if (!isValidIP(profile.dns)) {
      errors.push('Invalid DNS server format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate auto-reconnect configuration
export function validateAutoReconnectConfig(config: {
  enabled: boolean;
  maxAttempts: number;
  attemptInterval: number;
  fallbackToAP: boolean;
}): ValidationResult {
  const errors: string[] = [];

  // Validate max attempts (0 = unlimited, 1-100 = specific)
  if (config.maxAttempts < 0 || config.maxAttempts > 100) {
    errors.push('Max attempts must be 0 (unlimited) or between 1 and 100');
  }

  // Validate attempt interval (5-300 seconds)
  if (config.attemptInterval < 5 || config.attemptInterval > 300) {
    errors.push('Attempt interval must be between 5 and 300 seconds');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
