import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file found" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 5MB allowed" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const filename = `driver_${timestamp}${extension}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'drivers')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('Upload directory already exists or error creating:', error)
    }

    // Write file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/drivers/${filename}`

    return NextResponse.json({ 
      message: "File uploaded successfully",
      filename,
      url: publicUrl
    })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}