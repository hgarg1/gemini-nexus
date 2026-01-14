"use client";

import { UserSelectionModal } from "./user-selection-modal";

interface CreateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
  onConfirm: (userId: string) => void;
  onSearch?: (query: string) => void;
}

export function CreateDMModal({
  isOpen,
  onClose,
  users,
  onConfirm,
  onSearch,
}: CreateDMModalProps) {
  return (
    <UserSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="INITIATE_DIRECT_UPLINK"
      users={users}
      multiple={false}
      confirmText="ESTABLISH_LINK"
      onSearch={onSearch}
      onConfirm={(ids) => {
        const id = ids[0];
        if (id) onConfirm(id);
      }}
    />
  );
}
