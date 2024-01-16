"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddEditNoteDialog from "@/components/AddEditNoteDialog";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import AIChatButton from "@/components/AIChatButton";

export default function NavBar() {
  const {theme} = useTheme();
  const [showAddEditNoteDialog, setShowAddEditNoteDialog] = useState(false);

  return (
    <>
    <div className="p-4 shadow">
      <div className="m-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <span>Element 1</span>
        <Link href="/notes" className="flex items-center gap-1">
          <Image src={logo} alt="FlowBrain logo" width={40} height={40} />
          <span className="font-bold">FlowBrain</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              baseTheme: (theme === "dark" ? dark : undefined),
              elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } },
            }}
          />
          <ThemeToggleButton />
          <Button onClick={() => setShowAddEditNoteDialog(true)}>
            <Plus size={20} className="mr-2" />
            Add Note
          </Button>
          <AIChatButton />
        </div>
      </div>
    </div>
    <AddEditNoteDialog
      open={showAddEditNoteDialog}
      setOpen={setShowAddEditNoteDialog} />
    </>
  );
}
