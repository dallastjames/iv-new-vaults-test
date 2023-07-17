import { useDeviceSecurityVault } from "../utils/identity-vault";
import { SIMPLE_STRING_KEY } from "../utils/keys";
import { success, warn } from "../utils/toast";

type Action = {
  label: string;
  btnLabel: string;
  action: () => Promise<void> | void;
};

export function VaultLocked() {
  const [vault] = useDeviceSecurityVault();

  const actions: Action[] = [
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
  ];

  return (
    <div class="prose">
      <h3 class="text-center">Vault Locked</h3>
      <p class="text-center mb-3">Actions</p>
      <div class="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <>
            <label class="label">{action.label}</label>
            <button
              class="btn btn-secondary btn-sm"
              onClick={() => action.action()}
            >
              {action.btnLabel}
            </button>
          </>
        ))}
      </div>
    </div>
  );
}
