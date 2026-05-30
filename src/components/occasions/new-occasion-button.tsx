"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { NewOccasionForm } from "./new-occasion-form";

export function NewOccasionButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New occasion">
        <NewOccasionForm onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
