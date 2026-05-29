import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 },
    );
  }

  try {
    const { clientEmail, folderName, fileCount } = await request.json();
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "Client Vault <onboarding@resend.dev>",
      to: ["kachnamedia@gmail.com"],
      subject: "🚨 New Assets Uploaded to Vault",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px;">
            <h2 style="color: #d4af37;">New Assets Received</h2>
            <p><strong>Client:</strong> ${clientEmail}</p>
            <p><strong>Directory:</strong> ${folderName ? "/" + folderName : "Root Directory"}</p>
            <p><strong>Files Transferred:</strong> ${fileCount}</p>
            <br/>
            <a href="http://localhost:3000/admin" style="background-color:#d4af37;color:black;padding:10px 20px;text-decoration:none;font-weight:bold;text-transform:uppercase;">Access Kachna HQ</a>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent successfully", data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
