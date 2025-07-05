import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const { userId, token } = await req.json();
  const db = getFirestore();
  await db.collection("fcmTokens").doc(userId).set({ token });
  return NextResponse.json({ success: true });
}
