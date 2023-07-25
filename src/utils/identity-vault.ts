import {
  DeviceSecurityVault,
  DeviceSecurityVaultOptions,
  destroyVaultByVaultId,
} from "@ionic-enterprise/identity-vault";
import { Accessor, createSignal } from "solid-js";
import { error, success, warn } from "./toast";

const vaultId = "com.dallastjames.ionic.iv.newvault.myvault";

const [vault, setVault] = createSignal<DeviceSecurityVault | null>(null);

type UseDeviceSecurityVaultReturnType = [
  Accessor<DeviceSecurityVault | null>,
  {
    createVault: (createOptions: DeviceSecurityVaultOptions) => Promise<void>;
    exists: () => Promise<boolean>;
    destroyVault: () => Promise<void>;
    isLocked: () => Promise<boolean>;
    lock: () => Promise<void>;
    unlock: () => Promise<void>;
  }
];

export function useDeviceSecurityVault(): UseDeviceSecurityVaultReturnType {
  const createVault = async (createOptions: DeviceSecurityVaultOptions) => {
    try {
      if (!!vault()) {
        error("Vault already exists");
        throw new Error("Vault already exists");
      }
      const newVault = await DeviceSecurityVault.instance(vaultId);
      if (await newVault.exists()) {
        warn("Vault already exists");
        setVault(newVault);
        return;
      }
      warn("Creating vault");
      await newVault.create(createOptions);
      setVault(newVault);
    } catch (e: any) {
      if ("code" in e) {
        error(`Code: ${e.code}, Error creating vault: ${e.message}`);
        return;
      }
      error(`VAULT ERROR: ${JSON.stringify(e)}`);
      console.warn("OTHER VAULT ERROR", e);
    }
  };
  const destroyVault = async () => {
    try {
      await destroyVaultByVaultId(vaultId);
      setVault(null);
    } catch (e) {
      error(`VAULT DESTROY ERROR: ${JSON.stringify(e)}`);
    }
  };
  const exists = async () => {
    try {
      const exists = vault()?.exists();
      warn(`exists: ${exists}`);
      return !!exists;
    } catch (e) {
      error(`exists: ${JSON.stringify(e)}`);
      return false;
    }
  };
  const isLocked = async () => {
    try {
      const v = vault();
      if (!v) {
        warn(`isLocked: no vault exists`);
        return true;
      }
      const exists = await vault()?.exists();
      const locked = await vault()?.isLocked();
      warn(`isLocked: ${exists} ${locked}`);
      return !exists || !!locked;
    } catch (e: any) {
      error(`isLocked: ${JSON.stringify(e)}`);
      return false;
    }
  };
  const lock = async () => {
    try {
      await vault()?.lock();
    } catch (e) {
      error(`VAULT LOCK ERROR: ${JSON.stringify(e)}`);
    }
  };
  const unlock = async () => {
    try {
      await vault()?.unlock();
    } catch (e) {
      error(`VAULT UNLOCK ERROR: ${JSON.stringify(e)}`);
    }
  };

  return [vault, { createVault, exists, destroyVault, isLocked, lock, unlock }];
}
