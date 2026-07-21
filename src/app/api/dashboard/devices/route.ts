import { NextRequest, NextResponse } from "next/server"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import {
  getUserDevices,
  renameDevice,
  revokeDevice,
  revokeOtherDevices,
} from "@nba/lib/services/device"
import { validateOrThrow, deviceRenameSchema, deviceDeleteSchema } from "@nba/lib/validations"

export async function GET() {
  try {
    const session = await requireActiveUser()
    const devices = await getUserDevices(session.user.id)
    return NextResponse.json(devices)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const body = await req.json()
    const { deviceId, name } = validateOrThrow(deviceRenameSchema, body)
    await renameDevice(deviceId, name, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const body = await req.json()
    const { deviceId, revokeOthers } = validateOrThrow(deviceDeleteSchema, body)

    if (revokeOthers) {
      const devices = await getUserDevices(session.user.id)
      const currentId = devices[0]?.id
      if (!currentId) {
        return NextResponse.json({ ok: true })
      }
      await revokeOtherDevices(currentId, session.user.id)
      return NextResponse.json({ ok: true })
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 },
      )
    }
    await revokeDevice(deviceId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
