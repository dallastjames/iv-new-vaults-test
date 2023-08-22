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
  const [config, setConfig] = createSignal<any | null>(null);
  const [
    vault,
    {
      isLocked,
      createVault,
      lock,
      unlock,
      exists,
      destroyVault,
      unloadVaultFromMemory,
      getConfig,
    },
  ] = useDeviceSecurityVault();

  const actions: Action[] = [
    {
      label: "Check Lock Status",
      btnLabel: "isLocked()",
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
      btnLabel: "lock()",
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
      btnLabel: "unlock()",
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
      btnLabel: "getValue()",
      action: async () => {
        if (!vault()) return warn("Vault not initialized");
        const data = await vault()?.getValue(SIMPLE_STRING_KEY);
        if (data) return success(data);
        return warn("No data found");
      },
    },
    {
      label: "Attempt Write",
      btnLabel: "setValue()",
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
    {
      label: "Attempt Delete",
      btnLabel: "removeValue()",
      action: async () => {
        try {
          if (!vault()) return warn("Vault not initialized");
          vault()?.removeValue(SIMPLE_STRING_KEY);
          success(`Value deleted from vault`);
        } catch (e) {
          error(`Error deleting from vault: ${JSON.stringify(e)}`);
        }
      },
    },
    {
      label: "Destroy Vault",
      btnLabel: "destroy()",
      action: async () => {
        try {
          await vault()?.destroy();
          success(`Vault destroyed`);
        } catch (e) {
          error(`Error destroying vault: ${JSON.stringify(e)}`);
        }
        checkState();
      },
    },
    {
      label: "Unload Vault",
      btnLabel: "unload()",
      action: async () => {
        try {
          await unloadVaultFromMemory();
          success(`Vault unloaded`);
        } catch (e) {
          error(`Error unloading vault: ${JSON.stringify(e)}`);
        }
        checkState();
      },
    },
  ];

  async function checkState() {
    const vaultExists = await exists();
    setLocked(!vaultExists || (await isLocked()));
    setConfig(null);
  }

  async function initVault() {
    await createVault({
      allowBiometrics: true,
      allowSystemPasscode: true,
      ios: {
        biometricsLocalizedReason: "Reasons",
        biometricsLocalizedCancelTitle: "Get out of here",
        biometricsLocalizedFallbackTitle: `Don't get locked out`,
      },
      android: {
        requireClass3Security: false,
      },
    });
    checkState();
  }

  async function checkExists() {
    try {
      const vaultExists = await exists();
      if (vaultExists) return success("Vault exists");
      return warn("Vault does not exist");
    } catch (e) {
      error(`Error checking vault exists: ${JSON.stringify(e)}`);
    }
  }

  async function checkConfig() {
    try {
      const config = await getConfig();
      setConfig(config);
    } catch (e) {
      error(`Error checking config: ${JSON.stringify(e)}`);
    }
  }

  async function destroyVaultFn() {
    try {
      await destroyVault();
      success("Vault destroyed");
    } catch (e) {
      error(`Error destroying vault: ${JSON.stringify(e)}`);
    }
  }

  return (
    <div class="flex flex-col w-full">
      <div class="prose mb-4">
        <h2 class="text-center" onClick={() => checkState()}>
          Device Security
        </h2>
      </div>
      {vault() === null && (
        <div class="flex flex-col gap-4 mb-4 m-auto">
          <button class="btn btn-primary btn-sm" onClick={initVault}>
            Init Vault
          </button>
          <button class="btn btn-warning btn-sm" onClick={checkExists}>
            Check Vault Exists
          </button>
          <button class="btn btn-info btn-sm" onClick={checkConfig}>
            Check Config
          </button>
          <button class="btn btn-error btn-sm" onClick={destroyVaultFn}>
            Destroy Vault
          </button>
        </div>
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
        <>
          <p class="text-center">No Vault Loaded</p>
          {config() && (
            <pre class="max-w-full overflow-auto">
              <code>{JSON.stringify(config(), null, 2)}</code>
            </pre>
          )}
        </>
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
