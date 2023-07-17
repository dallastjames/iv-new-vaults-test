import {
  BiometricPermissionState,
  Device,
} from "@ionic-enterprise/identity-vault";

export async function getBiometricsStatus(): Promise<{
  supported: boolean;
  allowed: BiometricPermissionState;
  enabled: boolean;
}> {
  return {
    supported: await Device.isBiometricsSupported(),
    allowed: await Device.isBiometricsAllowed(),
    enabled: await Device.isBiometricsEnabled(),
  };
}

export function promptBiometrics() {
  return Device.showBiometricPrompt({
    iosBiometricsLocalizedReason: "Please authenticate to unlock your vault",
  });
}
