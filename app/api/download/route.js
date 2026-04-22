import cloudinary from "@/lib/cloudinary";

/**
 * Parse a Cloudinary secure_url into its components.
 *
 * URL shape:
 *   https://res.cloudinary.com/{cloud}/{resourceType}/upload/[transforms/][v{ver}/]{publicId}[.{format}]
 *
 * For resource_type "image":  public_id has NO extension; format is separate.
 * For resource_type "raw":    public_id INCLUDES the extension; format is "".
 */
function parseCloudinaryUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        if (!url.hostname.includes("cloudinary.com")) return null;

        // ['', cloudName, resourceType, 'upload', ...rest]
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length < 4 || parts[2] !== "upload") return null;

        const resourceType = parts[1]; // "image" | "raw" | "video"
        const afterUpload = parts.slice(3); // everything after /upload/

        // Locate the version segment (e.g. "v1712345678")
        const versionIdx = afterUpload.findIndex((p) => /^v\d+$/.test(p));
        const publicIdParts =
            versionIdx >= 0 ? afterUpload.slice(versionIdx + 1) : afterUpload;

        const publicIdWithExt = publicIdParts.join("/");

        let publicId, format;
        if (resourceType === "raw") {
            // Raw: full path including extension is the public_id
            publicId = publicIdWithExt;
            format = publicIdWithExt.split(".").pop() || "";
        } else {
            // Image / video: strip extension into format
            const dotIdx = publicIdWithExt.lastIndexOf(".");
            if (dotIdx >= 0) {
                publicId = publicIdWithExt.slice(0, dotIdx);
                format = publicIdWithExt.slice(dotIdx + 1);
            } else {
                publicId = publicIdWithExt;
                format = "";
            }
        }

        return { resourceType, publicId, format };
    } catch {
        return null;
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fileUrl = searchParams.get("url");
        const fileName = searchParams.get("name") || "file";
        const forceAttachment = searchParams.get("attachment") === "1";

        if (!fileUrl) {
            return Response.json({ error: "Missing url param" }, { status: 400 });
        }

        let parsedHost;
        try {
            parsedHost = new URL(fileUrl);
        } catch {
            return Response.json({ error: "Invalid URL" }, { status: 400 });
        }

        if (!parsedHost.hostname.includes("cloudinary.com")) {
            return Response.json({ error: "URL not allowed" }, { status: 403 });
        }

        // --- Build a signed download URL via Cloudinary SDK ---
        // private_download_url() hits the Cloudinary API endpoint (not CDN),
        // so it works even when CDN delivery is "Blocked for delivery".
        const parsed = parseCloudinaryUrl(fileUrl);

        let fetchUrl = fileUrl; // fallback to original if parsing fails

        if (parsed) {
            fetchUrl = cloudinary.utils.private_download_url(
                parsed.publicId,
                parsed.format,
                {
                    resource_type: parsed.resourceType,
                    type: "upload",
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    attachment: forceAttachment, // true = download, false = inline
                }
            );
        }

        // --- Server-side fetch using the signed URL ---
        const upstream = await fetch(fetchUrl, {
            method: "GET",
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; UniLife/1.0)",
                Accept: "*/*",
            },
        });

        if (!upstream.ok) {
            console.error(
                `Cloudinary upstream ${upstream.status} for publicId="${parsed?.publicId}" format="${parsed?.format}"`
            );
            return Response.json(
                { error: `Could not retrieve file (upstream ${upstream.status})` },
                { status: upstream.status }
            );
        }

        const contentType =
            upstream.headers.get("content-type") || "application/octet-stream";

        // forceAttachment=true  → Content-Disposition: attachment (browser downloads)
        // forceAttachment=false → Content-Disposition: inline  (browser opens PDF viewer etc.)
        const disposition = forceAttachment
            ? `attachment; filename="${fileName}"`
            : `inline; filename="${fileName}"`;

        return new Response(upstream.body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": disposition,
                "Cache-Control": "private, max-age=300",
            },
        });
    } catch (err) {
        console.error("Download proxy error:", err);
        return Response.json(
            { error: "Proxy failed: " + err.message },
            { status: 500 }
        );
    }
}
