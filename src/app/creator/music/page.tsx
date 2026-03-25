"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorMusicRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/creator/content/new"); }, [router]);
  return null;
}
