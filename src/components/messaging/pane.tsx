"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@nextui-org/drawer";

import { ChatHeader } from "./header";
import { ChatBody } from "./body";
import { ChatFooter } from "./footer";

interface ChatPaneProps {
  /** Whether the chat pane is currently open */
  isOpen: boolean;
  /** Callback function to close the chat pane */
  onClose: () => void;
}

/**
 * ChatPane component that provides a messaging interface using NextUI's Drawer.
 */
export const ChatPane: React.FC<ChatPaneProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Drawer
      backdrop="transparent"
      classNames={{
        base: ["bg-content1/95", "backdrop-blur-md", "text-foreground", "shadow-2xl", "dark:shadow-content1/20"].join(
          " "
        ),
        header: "border-b border-divider",
        body: "p-0 scrollbar-thin scrollbar-track-content2 scrollbar-thumb-content3",
        footer: "border-t border-divider bg-content2/50 backdrop-blur-xl",
        wrapper: ["max-w-[420px] w-full", "rounded-r-2xl", "shadow-xl shadow-content1/10"].join(" "),
      }}
      hideCloseButton={true}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            x: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            },
          },
          exit: {
            x: -420,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: [0.4, 0, 1, 1],
            },
          },
        },
      }}
      placement="left"
      size="md"
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <DrawerContent>
        <DrawerHeader className="px-4 py-3 flex justify-between">
          <ChatHeader onClose={onClose} />
        </DrawerHeader>
        <DrawerBody className="flex flex-col">
          <ChatBody />
        </DrawerBody>
        <DrawerFooter className="px-2 py-2">
          <ChatFooter inputRef={inputRef} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
