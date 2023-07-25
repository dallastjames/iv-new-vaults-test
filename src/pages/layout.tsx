import { createSignal, onMount } from "solid-js";
import { useDeviceSecurityVault } from "../utils/identity-vault";
import { getBiometricsStatus, promptBiometrics } from "../utils/device";
import { BiometricPermissionState } from "@ionic-enterprise/identity-vault";
import { success, warn, error } from "../utils/toast";
import { SIMPLE_STRING_KEY } from "../utils/keys";

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

type Action = {
  label: string;
  btnLabel: string;
  action: () => Promise<void> | void;
};

function DeviceSecurity() {
  const [locked, setLocked] = createSignal<boolean | null>(null);
  const [vault, { isLocked, createVault, lock, unlock }] =
    useDeviceSecurityVault();

  const actions: Action[] = [
    {
      label: "Check Lock Status",
      btnLabel: "vault.isLocked()",
      action: async () => {
        try {
          const lockStatus = await isLocked();
          setLocked(lockStatus);
          success(`Vault is ${lockStatus ? "locked" : "unlocked"}`);
        } catch (e: any) {
          error(`Error checking lock status: ${e.message}`);
        }
      },
    },
    {
      label: "Lock",
      btnLabel: "vault.lock()",
      action: async () => {
        try {
          await lock();
          await checkState();
          success(`Vault locked`);
        } catch (e) {
          error(`Error locking vault: ${JSON.stringify(e)}`);
        }
      },
    },
    {
      label: "Unlock",
      btnLabel: "vault.unlock()",
      action: async () => {
        try {
          await unlock();
          await checkState();
          success(`Vault unlocked`);
        } catch (e) {
          error(`Error unlocking vault: ${JSON.stringify(e)}`);
        }
      },
    },
    {
      label: "Attempt Read",
      btnLabel: "vault.getValue()",
      action: async () => {
        if (!vault()) return warn("Vault not initialized");
        const data = await vault()?.getValue(SIMPLE_STRING_KEY);
        if (data) return success(data);
        return warn("No data found");
      },
    },
    {
      label: "Attempt Write",
      btnLabel: "vault.setValue()",
      action: async () => {
        try {
          const value = prompt("Enter a value to write to the vault");
          if (!value) return warn("No value entered");
          if (!vault()) return warn("Vault not initialized");
          vault()?.setValue(SIMPLE_STRING_KEY, value);
          success(`Value written to vault: ${value}`);
        } catch (e) {
          error(`Error writing to vault: ${JSON.stringify(e)}`);
        }
      },
    },
  ];

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
        <h2 onClick={() => checkState()}>Device Security</h2>
      </div>
      {vault() === null && (
        <button class="btn btn-primary btn-sm mb-4" onClick={initVault}>
          Init Vault
        </button>
      )}
      {vault() !== null ? (
        <div class="prose">
          <h3 class="text-center">Vault {locked() ? "Locked" : "Unlocked"}</h3>
          <p class="text-center mb-3">Actions</p>
          <div class="grid grid-cols-2 gap-4">
            {actions.map((action) => (
              <VaultAction action={action} />
            ))}
          </div>
        </div>
      ) : (
        <p class="text-center">No Vault</p>
      )}
    </div>
  );
}

function VaultAction({ action }: { action: Action }) {
  const [pending, setPending] = createSignal(false);

  async function doAction() {
    setPending(true);
    await action.action();
    setPending(false);
    success("Action complete");
  }

  return (
    <>
      <label class="label">{action.label}</label>
      <button class="btn btn-secondary btn-sm" onClick={() => doAction()}>
        {pending() ? <Loading /> : action.btnLabel}
      </button>
    </>
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
