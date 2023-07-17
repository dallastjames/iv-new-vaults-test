import { createSignal, onMount } from "solid-js";
import { VaultLocked } from "./vault-locked";
import { VaultUnlocked } from "./vault-unlocked";
import { useDeviceSecurityVault } from "../utils/identity-vault";
import { getBiometricsStatus, promptBiometrics } from "../utils/device";
import { BiometricPermissionState } from "@ionic-enterprise/identity-vault";

type Pages = "device-security" | "device";

export function AppLayout() {
  const [page, setPage] = createSignal<Pages>("device");

  return (
    <div class="flex flex-col items-center justify-center h-full px-4">
      <div class="flex gap-4 mb-4">
        <button
          class="btn btn-sm btn-primary"
          onClick={() => setPage("device")}
        >
          Hardware
        </button>
        <button
          class="btn btn-sm btn-secondary"
          onClick={() => setPage("device-security")}
        >
          Device Security
        </button>
      </div>
      {page() === "device-security" ? <DeviceSecurity /> : null}
      {page() === "device" ? <Device /> : null}
    </div>
  );
}

function DeviceSecurity() {
  const [locked, setLocked] = createSignal<boolean | null>(null);
  const [vault, { isLocked, createVault }] = useDeviceSecurityVault();

  async function checkState() {
    setLocked(await isLocked());
  }

  async function initVault() {
    await createVault({
      allowBiometrics: true,
      allowSystemPasscode: true,
    });
    checkState();
  }

  return (
    <div class="flex flex-col">
      <div class="prose mb-4">
        <h2>Device Security</h2>
      </div>
      {vault() === null && (
        <button class="btn btn-primary btn-sm mb-4" onClick={initVault}>
          Init Vault
        </button>
      )}
      {vault() !== null ? (
        <>
          {locked() === true ? (
            <VaultLocked />
          ) : locked() === false ? (
            <VaultUnlocked />
          ) : null}
        </>
      ) : (
        <p class="text-center">No Vault</p>
      )}
    </div>
  );
}

function Device() {
  const [biometricsSupported, setBiometricsSupported] = createSignal<
    boolean | null
  >(null);
  const [biometricsAllowed, setBiometricsAllowed] =
    createSignal<BiometricPermissionState | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = createSignal<
    boolean | null
  >(null);

  onMount(async () => {
    const { supported, allowed, enabled } = await getBiometricsStatus();
    setBiometricsSupported(supported);
    setBiometricsAllowed(allowed);
    setBiometricsEnabled(enabled);
  });

  async function tryBiometrics() {
    await promptBiometrics();
    const { allowed } = await getBiometricsStatus();
    setBiometricsAllowed(allowed);
  }

  return (
    <div class="flex flex-col">
      <div class="prose mb-4">
        <h2 class="text-center">Hardware Config</h2>
        <div class="grid grid-cols-2 gap-4">
          <label class="">Biometrics Supported</label>
          <div class="flex items-center justify-center">
            {biometricsSupported() ? (
              biometricsSupported() ? (
                "YES"
              ) : (
                "NO"
              )
            ) : (
              <Loading />
            )}
          </div>
          <label class="">Biometrics Allowed</label>
          <div class="flex items-center justify-center">
            {biometricsAllowed() ? biometricsAllowed() : <Loading />}
          </div>
          <label class="">Biometrics Enabled</label>
          <div class="flex items-center justify-center">
            {biometricsEnabled() ? (
              biometricsEnabled() ? (
                "YES"
              ) : (
                "NO"
              )
            ) : (
              <Loading />
            )}
          </div>
        </div>
        <p class="text-center mb-3">Actions</p>
        <div class="grid grid-cols-2 gap-4">
          <label class="label">Prompt Biometrics</label>
          <button
            class="btn btn-secondary btn-sm"
            onClick={() => tryBiometrics()}
          >
            Prompt
          </button>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <span class="loading loading-ring loading-xs" />;
}
