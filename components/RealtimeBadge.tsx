"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export function RealtimeBadge({ meId, unread }: { meId: string; unread: number }) {
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('global-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new;
          // If the message is from someone else, refresh the server layout to update the badge
          if (msg.sender_id !== meId) {
            if (!path.includes('/messages')) {
              router.refresh();
            }
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, router, path]);

  if (unread === 0) return null;
  return <span className="ml-1 rounded-full bg-danger px-1.5 text-xs text-white">{unread}</span>;
}