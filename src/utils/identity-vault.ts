import {
  DeviceSecurityVault,
  DeviceSecurityVaultOptions,
  destroyVaultByVaultId,
  VaultErrorCodes,
} from "@ionic-enterprise/identity-vault";
import { Accessor, createSignal } from "solid-js";
import { error, warn } from "./toast";

const vaultId = "com.dallastjames.ionic.iv.newvault.myvault";

const [vault, setVault] = createSignal<DeviceSecurityVault | null>(null);

type UseDeviceSecurityVaultReturnType = [
  Accessor<DeviceSecurityVault | null>,
  {
    createVault: (createOptions: DeviceSecurityVaultOptions) => Promise<void>;
    exists: () => Promise<boolean>;
    destroyVault: () => Promise<void>;
    isLocked: () => Promise<boolean>;
  }
];

export function useDeviceSecurityVault(): UseDeviceSecurityVaultReturnType {
  const createVault = async (createOptions: DeviceSecurityVaultOptions) => {
    try {
      if (!!vault()) throw new Error("Vault already exists");
      const newVault = await DeviceSecurityVault.instance(vaultId);
      if (await newVault.exists()) {
        setVault(newVault);
      }
      await newVault.create(createOptions);
      setVault(newVault);
    } catch (e: any) {
      error(`Code: ${e.code}, Error creating vault: ${e.message}`);
      if ("code" in e) {
        console.warn("VAULT ERROR", e);
        return;
      }
      console.warn("OTHER VAULT ERROR", e);
    }
  };
  const destroyVault = async () => {
    try {
      await destroyVaultByVaultId(vaultId);
      setVault(null);
    } catch (e) {
      warn("Error destroying vault");
      console.warn("VAULT DESTROY ERROR", e);
    }
  };
  const exists = async () => {
    try {
      const vaultToCheck = await DeviceSecurityVault.instance(vaultId);
      return await vaultToCheck.exists();
    } catch (e) {
      return false;
    }
  };
  const isLocked = async () => {
    try {
      const vaultToCheck = await DeviceSecurityVault.instance(vaultId);
      return !(await vaultToCheck.exists()) || (await vaultToCheck.isLocked());
    } catch (e) {
      return false;
    }
  };

  return [vault, { createVault, exists, destroyVault, isLocked }];
}
